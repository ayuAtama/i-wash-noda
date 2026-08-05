// src/services/pickupOrder.services.ts
import { prisma } from "@/config/prisma";
import { Outlet } from "@/generated/prisma/client";
import { DriverJobStatusEnum } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";
import {
  OutletIdDto,
  PickupIdParamsDto,
  UserIdDto,
} from "@/validations/pickupOrder.validation";
import { format } from "date-fns";

export class PickupOrderService {
  // get all the pickup requests based on outlet id
  async getAllPickupRequests(
    outletId: OutletIdDto,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        accepted: false,
        order: {
          outlet_id: outletId,
          status: "waiting_for_driver_pickup" as const,
        },
      };

      const [pickupRequests, total] = await Promise.all([
        prisma.pickupRequest.findMany({
          where,
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
          skip,
          take,
        }),
        prisma.pickupRequest.count({ where }),
      ]);

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

      return {
        data: result,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
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
    // status: DriverJobStatusEnum,
  ) {
    try {
      // run all db operations in a single transaction
      const result = await prisma.$transaction(async (tx) => {
        // update status

        // find the driver status first
        const driverStatus = await tx.driverJobStatus.findUnique({
          where: {
            pickup_request_id: pickupOrderId,
            driver_id: userId,
          },
        });

        // throw not found
        if (!driverStatus) throw new HttpError(404, "This job not found");

        // update the status into on_delivery if the status is in_transit

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
          });
          return updateStatus;
        }

        // if on_delivery update to done
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
          });

          // fetch the order id
          const order = await tx.pickupRequest.findUnique({
            where: {
              id: pickupOrderId,
              driver_id: userId,
            },
          });

          // update the order status into arrived at outlet
          if (order?.order_id && updateStatus.status === "done") {
            await tx.order.update({
              where: {
                id: order.order_id,
              },
              data: {
                status: "arrived_at_outlet",
              },
            });
          }
          return updateStatus;
        }

        // throw it already done
        if (driverStatus.status === "done")
          throw new HttpError(400, "This Job already done");
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAcceptedPickupRequests(
    userId: UserIdDto,
    outletId: OutletIdDto,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        driver_id: userId,
        pickup_request_id: { not: null },
        status: { not: "done" as const },
        pickupRequest: {
          order: {
            outlet_id: outletId,
          },
        },
      };

      const [listPickedUpJob, total] = await Promise.all([
        prisma.driverJobStatus.findMany({
          where,
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
          skip,
          take,
        }),
        prisma.driverJobStatus.count({ where }),
      ]);

      const flattenResponse = listPickedUpJob.map((item) => ({
        id: item.pickupRequest?.id,
        status: item.status,
        updated_at: item.updated_at,
        customer: item.pickupRequest?.order.customer,
        outlet: item.pickupRequest?.order.outlet,
        pickupAddress: item.pickupRequest?.order.pickupAddress,
      }));

      return {
        data: flattenResponse,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllAlreadyPickedUpJob(
    userId: UserIdDto,
    outletId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        driver_id: userId,
        pickup_request_id: {
          not: null,
        },
        status: "done" as const,
      };

      const [jobs, total] = await Promise.all([
        prisma.driverJobStatus.findMany({
          where,
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
          skip,
          take,
        }),
        prisma.driverJobStatus.count({ where }),
      ]);

      return {
        data: jobs,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }
}
