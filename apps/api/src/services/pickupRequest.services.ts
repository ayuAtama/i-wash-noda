// src/services/pickupRequest.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import calculateDistance from "@/utils/haversineDistance";

export class PickupRequestService {
  async checkAddressFirst(userId: string) {
    try {
      // check if the user has any address
      const address = await prisma.userAddress.findFirst({
        where: {
          user_id: userId,
          is_default: true,
        },
      });

      // return error if no address in the result
      if (!address) {
        throw new HttpError(404, "User has no address");
      }

      // fetch the all the outlets firsts
      const getAllOutlets = await prisma.outlet.findMany({
        where: {
          is_deleted: false,
        },
        select: {
          id: true,
          name: true,
          lat: true,
          lng: true,
          price_per_kg: true,
          price_per_km: true,
          max_distance_km: true,
        },
      });

      // mutate and filter the outlet within the address
      const withinCoverage = getAllOutlets
        .map((outlet) => {
          //destructuring the needed data
          const { id, name, price_per_kg, price_per_km } = outlet;

          // calculate the distance
          const distance = calculateDistance(
            Number(address.lat),
            Number(address.lng),
            Number(outlet.lat),
            Number(outlet.lng)
          );

          // return the distance and mutate it into the outlet
          return {
            id,
            name,
            price_per_kg,
            price_per_km,
            distance_km: Number(distance.toFixed(2)),
            within_coverage: distance <= Number(outlet.max_distance_km),
          };
        })
        // eliminate the outlets that are not within coverage
        .filter((outlet) => outlet.within_coverage);
      return {
        withinCoverage,
        success: true,
        message: "Available outlets found",
      };
    } catch (error) {
      throw error;
    }
  }

  async createPickupRequest(
    userId: string,
    addressId: string,
    outletId: string
  ) {
    try {
      // check if the user is valid
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new HttpError(404, "User not found");

      // check if the address is valid
      const address = await prisma.userAddress.findUnique({
        where: { id: addressId },
      });
      if (!address) throw new HttpError(404, "Address not found");

      // check if the outlet is valid
      const outlet = await prisma.outlet.findUnique({
        where: { id: outletId },
      });
      if (!outlet) throw new HttpError(404, "Outlet not found");

      // calculate the distance between the user and the outlet
      const distance = calculateDistance(
        Number(address.lat),
        Number(address.lng),
        Number(outlet.lat),
        Number(outlet.lng)
      );

      // calculate the pickup and deliver price
      const pickupPrice = Math.ceil(distance * (outlet.price_per_km || 0));
      const deliverPrice = Math.ceil(distance * (outlet.price_per_km || 0));

      // make the order and pickup request order
      const order = await prisma.$transaction(async (tx) => {
        // create the order
        const order = await tx.order.create({
          data: {
            customer_id: user.id,
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
}
