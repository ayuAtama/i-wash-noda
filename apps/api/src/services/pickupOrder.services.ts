// src/services/pickupOrder.services.ts
import { prisma } from "@/config/prisma";
import { DriverJobStatusEnum } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";

export class PickupOrderService {
  // get all the pickup requests based on outlet id
  async getAllPickupRequests(outletId: string) {
    try {
      // get the data based on outlet id
      console.log("ueu");
      const pickupRequests = await prisma.pickupRequest.findMany({
        where: {
          accepted: false,
          order: {
            outlet_id: outletId,
            status: "waiting_for_driver_pickup",
          },
        },
        select: {
          // pickup request
          id: true,
          order_id: true,
          created_at: true,
          order: {
            // order
            select: {
              id: true,
              pickupAddress: {
                // pickup address
                select: {
                  id: true,
                  address: true,
                },
              },
              customer: {
                // customer
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return pickupRequests;
    } catch (error) {
      throw error;
    }
  }

  async acceptPickupRequest(
    outletId: string,
    pickupOrderId: string,
    userId: string
  ) {
    try {
      //accept the pickup request
      const { success, message, data } = await prisma.$transaction(
        async (tx) => {
          // check if the pickup request match with the outlet's driver
          const pickupRequest = await tx.pickupRequest.findUnique({
            where: {
              id: pickupOrderId,
            },
            include: {
              order: {
                select: { outlet_id: true },
              },
            },
          });
          if (!pickupRequest)
            throw new HttpError(404, "Pickup request not found");
          if (pickupRequest.order.outlet_id !== outletId) {
            throw new HttpError(
              400,
              "Pickup request does not match with the outlet's driver"
            );
          }
          if (pickupRequest.accepted) {
            throw new HttpError(400, "Pickup request already accepted");
          }

          // update the pickup request
          const updatePickupRequest = await tx.pickupRequest.update({
            where: {
              id: pickupOrderId,
              accepted: false,
            },
            data: {
              driver_id: userId,
              accepted: true,
            },
          });

          // update the order status
          const updateOrderStatus = await tx.order.update({
            where: {
              id: updatePickupRequest.order_id,
            },
            data: {
              driver_pickup_id: updatePickupRequest.driver_id,
              status: "in_transit_to_outlet",
            },
          });

          // create driver status
          const driverStatus = await tx.driverJobStatus.create({
            data: {
              driver_id: userId,
              pickup_request_id: updatePickupRequest.id,
              status: "in_transit",
            },
          });

          return {
            success: true,
            message: "Pickup request accepted successfully",
            data: {
              pickupRequest: updatePickupRequest,
              order: updateOrderStatus,
              driverJobStatus: driverStatus,
            },
          };
        }
      );

      return { success, message, data };
    } catch (error) {
      throw error;
    }
  }

  async upateStatusDriver(
    userId: string,
    pickupOrderId: string,
    status: DriverJobStatusEnum
  ) {
    try {
      // update status
      const updateStatus = await prisma.driverJobStatus.update({
        where: {
          pickup_request_id: pickupOrderId,
          driver_id: userId,
        },
        data: {
          status,
        },
      });

      return updateStatus;
    } catch (error) {
      throw error;
    }
  }

  async getAcceptedPickupRequests(userId: string, outletId: string) {
    try {
      // get list all the accepted job
      console.log("alamak error");
      const listPickedUpJob = await prisma.driverJobStatus.findMany({
        where: {
          driver_id: userId,
          pickup_request_id: { not: null },
          status: { not: "done" },
          pickupRequest: {
            order: {
              outlet_id: outletId,
            },
          },
        },
        include: {
          pickupRequest: {
            include: {
              order: {
                include: {
                  pickupAddress: true,
                  outlet: true,
                },
              },
            },
          },
        },
      });

      return listPickedUpJob;
    } catch (error) {
      throw error;
    }
  }
}
