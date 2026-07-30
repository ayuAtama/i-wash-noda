// src/services/pickupOrder.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  OutletIdDto,
  PickupIdParamsDto,
  UserIdDto,
} from "@/validations/pickupOrder.validation";
import { format } from "date-fns";

export class PickupOrderService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async getAllPickupRequests(outletId: OutletIdDto) {
    try {
      const pickupRequests = await this.prisma.pickupRequest.findMany({
        where: {
          accepted: false,
          order: {
            outlet_id: outletId,
            status: "waiting_for_driver_pickup",
          },
        },
        select: {
          id: true,
          order_id: true,
          created_at: true,
          order: {
            select: {
              id: true,
              pickupAddress: {
                select: {
                  id: true,
                  address: true,
                  lat: true,
                  lng: true,
                },
              },
              customer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

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

      return result;
    } catch (error) {
      throw error;
    }
  }

  async acceptPickupRequest(
    outletId: OutletIdDto,
    pickupOrderId: PickupIdParamsDto["id"],
    userId: UserIdDto,
  ) {
    try {
      const { success, message, data } = await this.prisma.$transaction(
        async (tx) => {
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

          const updateOrderStatus = await tx.order.update({
            where: {
              id: updatePickupRequest.order_id,
            },
            data: {
              driver_pickup_id: updatePickupRequest.driver_id,
              status: "out_for_pickup",
            },
            select: {
              id: true,
              customer: {
                select: {
                  name: true,
                },
              },
              outlet: {
                select: {
                  name: true,
                },
              },
              pickupAddress: {
                select: {
                  address: true,
                },
              },
              pickupDriver: {
                select: {
                  name: true,
                },
              },
            },
          });

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
              ...updateOrderStatus,
              accepted: format(Date.now(), "MMMM do, yyyy 'at' h:mm a"),
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
    userId: UserIdDto,
    pickupOrderId: PickupIdParamsDto["id"],
  ) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const driverStatus = await tx.driverJobStatus.findUnique({
          where: {
            pickup_request_id: pickupOrderId,
            driver_id: userId,
          },
          select: { status: true },
        });

        if (!driverStatus) throw new HttpError(404, "This job not found");

        if (driverStatus.status === "in_transit") {
          const updateStatus = await tx.driverJobStatus.update({
            where: {
              pickup_request_id: pickupOrderId,
              driver_id: userId,
            },
            data: {
              status: "on_delivery",
              updated_at: new Date(),
            },
            select: {
              id: true,
              status: true,
              pickup_request_id: true,
              driver_id: true,
              updated_at: true,
              created_at: true,
              pickupRequest: {
                select: {
                  order_id: true,
                },
              },
            },
          });

          await tx.order.update({
            where: {
              id: updateStatus.pickupRequest?.order_id,
            },
            data: { status: "in_transit_to_outlet" },
          });

          return updateStatus;
        }

        if (driverStatus.status === "on_delivery") {
          const updateStatus = await tx.driverJobStatus.update({
            where: {
              pickup_request_id: pickupOrderId,
              driver_id: userId,
            },
            data: {
              status: "done",
              updated_at: new Date(),
            },
            select: {
              id: true,
              status: true,
              pickup_request_id: true,
              driver_id: true,
              updated_at: true,
              created_at: true,
              pickupRequest: {
                select: {
                  order_id: true,
                },
              },
            },
          });

          if (
            updateStatus?.pickupRequest?.order_id &&
            updateStatus.status === "done"
          ) {
            await tx.order.update({
              where: {
                id: updateStatus.pickupRequest.order_id,
              },
              data: {
                status: "arrived_at_outlet",
              },
            });
          }
          return updateStatus;
        }

        if (driverStatus.status === "done")
          throw new HttpError(400, "This Job already done");
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAcceptedPickupRequests(userId: UserIdDto, outletId: OutletIdDto) {
    try {
      const listPickedUpJob = await this.prisma.driverJobStatus.findMany({
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
        select: {
          id: true,
          status: true,
          updated_at: true,
          pickupRequest: {
            select: {
              id: true,
              order: {
                select: {
                  customer: {
                    select: {
                      name: true,
                    },
                  },
                  outlet: {
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
                },
              },
            },
          },
        },
      });

      const flattenResponse = listPickedUpJob.map((listPickedUpJob) => ({
        id: listPickedUpJob.pickupRequest?.id,
        status: listPickedUpJob.status,
        updated_at: listPickedUpJob.updated_at,

        customer: listPickedUpJob.pickupRequest?.order.customer,
        outlet: listPickedUpJob.pickupRequest?.order.outlet,
        pickupAddress: listPickedUpJob.pickupRequest?.order.pickupAddress,
      }));

      return flattenResponse;
    } catch (error) {
      throw error;
    }
  }

  async getAllAlreadyPickedUpJob(userId: UserIdDto, outletId: OutletIdDto) {
    try {
      const jobs = await this.prisma.driverJobStatus.findMany({
        where: {
          driver_id: userId,
          pickup_request_id: {
            not: null,
          },
          status: "done",
          pickupRequest: {
            order: {
              outlet_id: outletId,
            },
          },
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
        orderBy: {
          created_at: "desc",
        },
      });

      const result = jobs.map((job) => ({
        id: job.pickupRequest?.id,
        status: job.status,
        order_id: job.pickupRequest?.order.id,
        customer_name: job.pickupRequest?.order.customer?.name,
        pickup_address: job.pickupRequest?.order.pickupAddress?.address,
        pickup_coordinates: `${job.pickupRequest?.order.pickupAddress?.lat}, ${job.pickupRequest?.order.pickupAddress?.lng}`,
        created_at: job.pickupRequest?.created_at,
        updated_at: job.updated_at,
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }
}
