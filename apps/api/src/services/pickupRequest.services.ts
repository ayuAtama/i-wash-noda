// src/services/pickupRequest.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { GeoUtils } from "@/utils/haversineDistance";
import {
  CreatePickupRequestDto,
  PickupRequestIdParamsDto,
} from "@/validations/pickupRequest.validation";

export class PickupRequestService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async checkAddressFirst(userId: PickupRequestIdParamsDto["id"]) {
    try {
      const address = await this.prisma.userAddress.findFirst({
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

      if (!address) {
        throw new HttpError(404, "User has no address");
      }

      const checkExistingPickupRequestOrder =
        await this.prisma.pickupRequest.findFirst({
          where: {
            accepted: false,
            driver_id: null,
            order: {
              customer_id: userId,
              status: "waiting_for_driver_pickup",
            },
          },
        });

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
      const availableOutlets = await this.prisma.$queryRaw`
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
      FROM outlets
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
      const { addressId, outletId } = payload;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      const address = await this.prisma.userAddress.findUnique({
        where: { id: addressId, user_id: userId },
      });
      if (!address)
        throw new HttpError(
          404,
          "Address not found or perhaps you're the little hacker?",
        );

      const outlet = await this.prisma.outlet.findUnique({
        where: { id: outletId },
      });
      if (!outlet)
        throw new HttpError(
          404,
          "Outlet not found or perhaps you're the little hacker?",
        );

      let distance = GeoUtils.calculateDistance(
        Number(address.lat),
        Number(address.lng),
        Number(outlet.lat),
        Number(outlet.lng),
      );
      distance = Math.ceil(distance);

      if (distance > Number(outlet.max_distance_km))
        throw new HttpError(400, "Outlet is not within coverage");

      const pickupPrice = Math.ceil(distance * (outlet.price_per_km || 2500));
      const deliverPrice = Math.ceil(distance * (outlet.price_per_km || 2500));

      const order = await this.prisma.$transaction(async (tx) => {
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

        const order = await tx.order.create({
          data: {
            customer_id: user.id,
            pickup_address_id: address.id,
            outlet_id: outlet.id,
            pickup_fee: pickupPrice,
            delivery_fee: deliverPrice,
            laundry_price: 0,
            total_kilo: 0,
            total_km: distance,
            total_amount: pickupPrice + deliverPrice,
            status: "waiting_for_driver_pickup",
            paid: false,
          },
        });

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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      const existingPickupRequest = await this.prisma.pickupRequest.findFirst({
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

      const cancel = await this.prisma.$transaction(async (tx) => {
        const cancelPickupRequest = await tx.pickupRequest.delete({
          where: {
            id: existingPickupRequest.id,
            order_id: OrderId,
            accepted: false,
            driver_id: null,
          },
        });

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

      return {
        success: true,
        message: "Pickup request cancelled successfully",
        data: cancel,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkPickupOrderStatus(userId: PickupRequestIdParamsDto["id"]) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      const order = await this.prisma.order.findFirst({
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
