// src/services/pickupOrder.services.ts
import { prisma } from "@/config/prisma";
import { DriverJobStatusEnum } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";
import { format } from "date-fns";

export class PickupOrderService {
  // get all the pickup requests based on outlet id
  async getAllPickupRequests(outletId: string) {
    try {
      // get the data based on outlet id
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
                  lat: true,
                  lng: true,
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

      // restructure the data into human readable
      const result = pickupRequests.map((pickupRequest) => {
        const readableDate = format(
          pickupRequest.created_at,
          "MMMM do, yyyy 'at' h:mm a",
        );
        return {
          id: pickupRequest.id,
          order_id: pickupRequest.order_id,
          customer_name: pickupRequest.order.customer!.name,
          customer_address: pickupRequest.order.pickupAddress!.address,
          customer_coordinates: `${pickupRequest.order.pickupAddress!.lat}, ${pickupRequest.order.pickupAddress!.lng}`,
          gmap_link: `https://www.google.com/maps/dir/?api=1&destination=${pickupRequest.order.pickupAddress!.lat},${pickupRequest.order.pickupAddress!.lng}`,
          created_at: readableDate,
        };
      });

      //return pickupRequests;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async acceptPickupRequest(
    outletId: string,
    pickupOrderId: string,
    userId: string,
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
              "Pickup request does not match with the outlet's driver",
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
        },
      );

      return { success, message, data };
    } catch (error) {
      throw error;
    }
  }

  async upateStatusDriver(
    userId: string,
    pickupOrderId: string,
    status: DriverJobStatusEnum,
  ) {
    try {
      // run all db operations in a single transaction
      const result = await prisma.$transaction(async (tx) => {
        // update status
        const updateStatus = await tx.driverJobStatus.update({
          where: {
            pickup_request_id: pickupOrderId,
            driver_id: userId,
          },
          data: {
            status,
            updated_at: new Date(),
          },
        });

        // update the order status if the status is done
        if (status === "done") {
          // fetch the order id
          const order = await tx.pickupRequest.findUnique({
            where: {
              id: pickupOrderId,
              driver_id: userId,
            },
          });

          // update the order status into arrived at outlet
          if (order?.order_id) {
            await tx.order.update({
              where: {
                id: order.order_id,
              },
              data: {
                status: "arrived_at_outlet",
              },
            });
          }
        }

        return updateStatus;
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAcceptedPickupRequests(userId: string, outletId: string) {
    try {
      // get list all the accepted job
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

  async getAllAlreadyPickedUpJob(userId: string, outletId: string) {
    try {
      // get list all the accepted job
      // const listPickedUpJob = await prisma.driverJobStatus.findMany({
      //   where: {
      //     driver_id: userId,
      //     pickup_request_id: { not: null },
      //     status: "done",
      //   },
      // });

      // return listPickedUpJob;

      const jobs = await prisma.driverJobStatus.findMany({
        where: {
          driver_id: userId,
          pickup_request_id: {
            not: null,
          },
          status: "done",
        },
        select: {
          id: true,
          status: true,
          updated_at: true,

          pickupRequest: {
            select: {
              id: true,
              created_at: true,

              order: {
                select: {
                  id: true,
                  total_amount: true,
                  total_kilo: true,
                  pickup_fee: true,
                  status: true,
                  created_at: true,

                  customer: {
                    select: {
                      name: true,
                    },
                  },

                  pickupAddress: {
                    select: {
                      address: true,
                      lat: true,
                      lng: true,
                    },
                  },

                  outlet: {
                    select: {
                      name: true,
                      address: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return jobs;
    } catch (error) {
      throw error;
    }
  }
}
