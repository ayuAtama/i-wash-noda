// src/services/pickupRequest.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import calculateDistance from "@/utils/haversineDistance";
import {
  CreatePickupRequestDto,
  PickupRequestIdParamsDto,
} from "@/validations/pickupRequest.validation";

export class PickupRequestService {
  async checkAddressFirst(userId: PickupRequestIdParamsDto["id"]) {
    try {
      // check if the user has any default address
      // (if want to change address redirect to another page on the front end)
      // e.g. Not this address? (in italic)
      const address = await prisma.userAddress.findFirst({
        where: {
          user_id: userId,
          is_default: true,
        },
        select: {
          id: true,
          label: true,
          address: true,
          lat: true,
          lng: true,
        },
      });

      // return error if no address in the result
      // and redirect to the create address page in front end
      if (!address) {
        throw new HttpError(404, "User has no address");
      }

      // also check if the pickup order has been created (only can create one)
      // if so, return to status page of the pickup order (you can see the cancel button)
      // after accepted it'll show the pay button instead if the laundry price (outlet_admin) is not null (washing_in_progress)
      // the button to access this page become disabled
      const checkExistingPickupRequestOrder =
        await prisma.pickupRequest.findFirst({
          where: {
            accepted: false,
            driver_id: null,
            order: {
              customer_id: userId,
              status: "waiting_for_driver_pickup",
            },
          },
        });

      // return error because the pickup order has been created once
      if (checkExistingPickupRequestOrder) {
        return {
          success: false,
          message: "Pickup order has been created once",
          data: checkExistingPickupRequestOrder,
        };
      }

      // // fetch the all the outlets firsts
      // const getAllOutlets = await prisma.outlet.findMany({
      //   where: {
      //     is_deleted: false,
      //   },
      //   select: {
      //     id: true,
      //     name: true,
      //     lat: true,
      //     lng: true,
      //     price_per_kg: true,
      //     price_per_km: true,
      //     max_distance_km: true,
      //   },
      // });

      // // mutate and filter the outlet within the address
      // const withinCoverage = getAllOutlets
      //   .map((outlet) => {
      //     //destructuring the needed data
      //     const { id, name, price_per_kg, price_per_km } = outlet;

      //     // calculate the distance
      //     const distance = calculateDistance(
      //       Number(address.lat),
      //       Number(address.lng),
      //       Number(outlet.lat),
      //       Number(outlet.lng),
      //     );

      //     // return the distance and mutate it into the outlet
      //     return {
      //       id,
      //       name,
      //       price_per_kg,
      //       price_per_km,
      //       distance_km: Number(distance.toFixed(2)),
      //       within_coverage: distance <= Number(outlet.max_distance_km),
      //     };
      //   })
      //   // eliminate the outlets that are not within coverage
      //   .filter((outlet) => outlet.within_coverage);

      // raw query method
      const userLat = Number(address.lat);
      const userLng = Number(address.lng);
      const availableOutlets = await prisma.$queryRaw`
          SELECT
          id, name, lat, lng, price_per_kg, price_per_km, max_distance_km,
          ROUND((
          6371 * 2 * ASIN(
            SQRT(
              POWER(SIN(RADIANS(lat - ${userLat}) / 2), 2) +
              COS(RADIANS(${userLat})) * COS(RADIANS(lat)) *
              POWER(SIN(RADIANS(lng - ${userLng}) / 2), 2)
            )
          )
        )::numeric, 2) AS distance_km
      FROM outlets /* <--- EXACT MATCH TO YOUR @@map("outlets") */
      WHERE is_deleted = false
      AND (
        6371 * 2 * ASIN(
          SQRT(
            POWER(SIN(RADIANS(lat - ${userLat}) / 2), 2) +
            COS(RADIANS(${userLat})) * COS(RADIANS(lat)) *
            POWER(SIN(RADIANS(lng - ${userLng}) / 2), 2)
          )
        )
      ) <= max_distance_km
      ORDER BY distance_km ASC;
        `;

      return {
        success: true,
        message: "Available outlets found",
        //withinCoverage,
        availableOutlets,
        address,
      };
    } catch (error) {
      throw error;
    }
  }

  async createPickupRequest(
    userId: PickupRequestIdParamsDto["id"],
    payload: CreatePickupRequestDto,
  ) {
    try {
      // destructure and get the address id and the outlet id
      const { addressId, outletId } = payload;

      // check if the user is valid
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new HttpError(404, "User not found");

      // check if the address is valid and belongs to the user
      const address = await prisma.userAddress.findUnique({
        where: { id: addressId, user_id: userId },
      });
      if (!address)
        throw new HttpError(
          404,
          "Address not found or perhaps you're the little hacker?",
        );

      // check if the outlet is valid
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });
      if (!outlet)
        throw new HttpError(
          404,
          "Outlet not found or perhaps you're the little hacker?",
        );

      // calculate the distance between the user and the outlet
      const distance = calculateDistance(
        Number(address.lat),
        Number(address.lng),
        Number(outlet.lat),
        Number(outlet.lng),
      );

      // validate the outlet id coverage the address id
      if (distance > Number(outlet.max_distance_km))
        throw new HttpError(400, "Outlet is not within coverage");

      // calculate the pickup and deliver price
      const pickupPrice = Math.ceil(distance * (outlet.price_per_km || 0));
      const deliverPrice = Math.ceil(distance * (outlet.price_per_km || 0));

      // make the order and pickup request order
      const order = await prisma.$transaction(async (tx) => {
        // check if the user has already create the pickup request
        const checkExisting = await tx.pickupRequest.findFirst({
          where: {
            accepted: false,
            driver_id: null,
            order: {
              customer_id: user.id,
              status: "waiting_for_driver_pickup",
            },
          },
        });
        if (checkExisting) {
          throw new HttpError(
            409,
            "Pickup order has been created, please be patient for the driver to get to your location",
          );
        }

        // create the order
        const order = await tx.order.create({
          data: {
            customer_id: user.id,
            pickup_address_id: address.id,
            outlet_id: outlet.id,
            pickup_fee: pickupPrice,
            delivery_fee: deliverPrice,
            laundry_price: 0,
            total_kilo: 0,
            total_amount: pickupPrice + deliverPrice,
            status: "waiting_for_driver_pickup",
            paid: false,
          },
        });

        // create the pickup request to driver
        await tx.pickupRequest.create({
          data: { order_id: order.id, accepted: false },
        });

        return {
          order_id: order.id,
          estimated_fee: {
            pickup: order.pickup_fee,
            delivery: order.delivery_fee,
            total: order.total_amount,
          },
          status: order.status,
        };
      });

      return order;
    } catch (error) {
      throw error;
    }
  }

  async cancelPickupRequest(
    userId: PickupRequestIdParamsDto["id"],
    OrderId: PickupRequestIdParamsDto["id"],
  ) {
    try {
      // check if the user is valid
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new HttpError(404, "User not found");

      // check the pickup request by outlet and the userId(prevent abuse)
      const existingPickupRequest = await prisma.pickupRequest.findFirst({
        where: {
          order_id: OrderId,
          accepted: false,
          driver_id: null,
          order: {
            customer_id: user.id,
            status: "waiting_for_driver_pickup",
          },
        },
      });

      if (!existingPickupRequest)
        throw new HttpError(
          404,
          "Pickup request id not found! because you are the little hacker",
        );

      // cancel the pickup request and the order
      const cancel = await prisma.$transaction(async (tx) => {
        // cancel the pickup request
        const cancelPickupRequest = await tx.pickupRequest.delete({
          where: {
            id: existingPickupRequest.id,
            order_id: OrderId,
            accepted: false,
            driver_id: null,
          },
        });

        // cancel the order
        await tx.order.delete({
          where: {
            id: cancelPickupRequest.order_id,
            customer_id: user.id,
            status: "waiting_for_driver_pickup",
          },
        });

        return {
          order_id: cancelPickupRequest.order_id,
          pickup_request_id: cancelPickupRequest.id,
          status: "cancelled",
        };
      });

      // return the response
      return {
        success: true,
        message: "Pickup request cancelled successfully",
        data: cancel,
      };
    } catch (error) {
      throw error;
    }
  }

  // check status of the pickup request order (not only pickup request for customer)
  async checkPickupOrderStatus(userId: PickupRequestIdParamsDto["id"]) {
    try {
      // check if the user is valid
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await prisma.order.findFirst({
        where: {
          customer_id: userId,
          status: "waiting_for_driver_pickup",
          driver_pickup_id: null,
        },
        select: {
          id: true,
          status: true,
          paid: true,
          pickup_fee: true,
          delivery_fee: true,
          total_kilo: true,
          laundry_price: true,
          total_amount: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!order)
        throw new HttpError(404, "Currently there is no active order");

      // return the response
      return {
        success: true,
        message: "Order status fetched successfully",
        data: order,
      };
    } catch (err) {
      throw err;
    }
  }
}
