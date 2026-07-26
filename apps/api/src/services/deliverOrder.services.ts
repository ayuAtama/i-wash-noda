// src/services/deliveryOrder.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  DeliveryIdParamsDTO,
  OutletIdDTO,
  UserIdDTO,
} from "@/validations/deliveryOder.validation";
import { format } from "date-fns";

export class DeliveryOrderService {
  async getAllDeliveryRequests(outletId: OutletIdDTO) {
    try {
      const deliveryRequests = await prisma.deliveryRequest.findMany({
        where: {
          accepted: false,
          order: {
            outlet_id: outletId,
            status: "waiting_for_driver_deliver",
          },
        },
        select: {
          id: true,
          order_id: true,
          created_at: true,
          order: {
            // order
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
      const result = deliveryRequests.map((deliveryRequest) => {
        const readableDate = format(
          deliveryRequest.created_at,
          "MMMM do, yyyy 'at' h:mm a",
        );
        return {
          id: deliveryRequest.id,
          order_id: deliveryRequest.order_id,
          customer_name: deliveryRequest.order.customer!.name,
          customer_address: deliveryRequest.order.pickupAddress!.address,
          customer_coordinates: `${deliveryRequest.order.pickupAddress!.lat}, ${deliveryRequest.order.pickupAddress!.lng}`,
          gmap_link: `https://www.google.com/maps/dir/?api=1&destination=${deliveryRequest.order.pickupAddress!.lat},${deliveryRequest.order.pickupAddress!.lng}`,
          created_at: readableDate,
        };
      });

      //return deliveryRequests;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async acceptDeliveryRequest(
    outletId: OutletIdDTO,
    deliveryOrderId: DeliveryIdParamsDTO["deliveryId"],
    userId: UserIdDTO,
  ) {
    try {
      const { success, message, data } = await prisma.$transaction(
        async (tx) => {
          const deliveryRequest = await tx.deliveryRequest.findUnique({
            where: {
              id: deliveryOrderId,
            },
            include: {
              order: {
                select: { outlet_id: true },
              },
            },
          });
          if (!deliveryRequest)
            throw new HttpError(404, "Delivery Request not found");
          if (deliveryRequest.order.outlet_id !== outletId) {
            throw new HttpError(
              400,
              "Delivery Request does not match with the outlet's driver",
            );
          }
          if (deliveryRequest.accepted) {
            throw new HttpError(400, "Delivery Request already accepted");
          }

          // update the delivery request
          const updateDeliveryRequest = await tx.deliveryRequest.update({
            where: {
              id: deliveryRequest.id,
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
              id: updateDeliveryRequest.order_id,
            },
            data: {
              driver_delivery_id: updateDeliveryRequest.driver_id,
              status: "out_for_delivery",
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
                  lat: true,
                  lng: true,
                },
              },
              deliveryDriver: {
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
              delivery_request_id: updateDeliveryRequest.id,
              status: "in_transit",
            },
          });

          const normalizeData = {
            id: updateOrderStatus.id,
            driverName: updateOrderStatus.deliveryDriver?.name,
            outletName: updateOrderStatus.outlet.name,
            customerName: updateOrderStatus.customer?.name,
            deliveryAddress: updateOrderStatus.pickupAddress?.address,
            deliveryCoordinates: `${updateOrderStatus.pickupAddress?.lat}, ${updateOrderStatus.pickupAddress?.lng}`,
          };

          return {
            success: true,
            message: "Delivery Request accepted successfully",
            data: {
              ...normalizeData,
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
    userId: UserIdDTO,
    deliveryOrderId: DeliveryIdParamsDTO["deliveryId"],
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const driverStatus = await tx.driverJobStatus.findUnique({
          where: {
            delivery_request_id: deliveryOrderId,
            driver_id: userId,
          },
          select: { status: true },
        });
        if (!driverStatus) throw new HttpError(404, "This job not found");

        if (driverStatus.status === "in_transit") {
          const updateStatus = await tx.driverJobStatus.update({
            where: {
              delivery_request_id: deliveryOrderId,
              driver_id: userId,
            },
            data: {
              status: "on_delivery",
              updated_at: new Date(),
            },
            select: {
              id: true,
              status: true,
              delivery_request_id: true,
              updated_at: true,
            },
          });
          return updateStatus;
        }

        // if on_delivery update to done
        if (driverStatus.status === "on_delivery") {
          const updateStatus = await tx.driverJobStatus.update({
            where: {
              delivery_request_id: deliveryOrderId,
              driver_id: userId,
            },
            data: {
              status: "done",
              updated_at: new Date(),
            },
            select: {
              id: true,
              status: true,
              delivery_request_id: true,
              deliveryRequest: {
                select: { order_id: true },
              },
              updated_at: true,
            },
          });

          // update the order status into arrived at outlet
          if (
            updateStatus.deliveryRequest?.order_id &&
            updateStatus.status === "done"
          ) {
            await tx.order.update({
              where: {
                id: updateStatus.deliveryRequest.order_id,
              },
              data: {
                status: "delivered",
              },
            });
          }
          return updateStatus;
        }

        // throw it already done
        if (driverStatus.status === "done")
          throw new HttpError(400, "This Job already done");

        throw new HttpError(400, "Invalid job status");
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAcceptedDeliveryRequests(userId: UserIdDTO, outletId: OutletIdDTO) {
    try {
      // get list all the accepted job
      const listPickedUpJob = await prisma.driverJobStatus.findMany({
        where: {
          driver_id: userId,
          delivery_request_id: { not: null },
          status: { not: "done" },
          deliveryRequest: {
            order: {
              outlet_id: outletId,
            },
          },
        },
        select: {
          id: true,
          status: true,
          updated_at: true,
          deliveryRequest: {
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
        id: listPickedUpJob.deliveryRequest?.id,
        status: listPickedUpJob.status,
        updated_at: listPickedUpJob.updated_at,
        customer: listPickedUpJob.deliveryRequest?.order.customer?.name,
        outlet: listPickedUpJob.deliveryRequest?.order.outlet.name,
        deliveryAddress:
          listPickedUpJob.deliveryRequest?.order.pickupAddress?.address,
        deliveryCoordinates: `${listPickedUpJob.deliveryRequest?.order.pickupAddress?.lat}, ${listPickedUpJob.deliveryRequest?.order.pickupAddress?.lng}`,
      }));

      //return listPickedUpJob;
      return {
        success: true,
        message: "Active Jobs fetched successfully",
        data: flattenResponse,
      };
    } catch (error) {
      throw error;
    }
  }

  async getALLAlreadyDeliveredRequests(
    userId: UserIdDTO,
    outletId: OutletIdDTO,
  ) {
    try {
      const jobs = await prisma.driverJobStatus.findMany({
        where: {
          driver_id: userId,
          delivery_request_id: {
            not: null,
          },
          status: "done",
          deliveryRequest: {
            order: {
              outlet_id: outletId,
            },
          },
        },
        select: {
          id: true,
          status: true,
          updated_at: true,

          deliveryRequest: {
            select: {
              id: true,
              created_at: true,

              order: {
                select: {
                  id: true,
                  total_amount: true,
                  total_kilo: true,
                  pickup_fee: true,
                  delivery_fee: true,
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
        id: job.deliveryRequest?.id,
        status: job.status,
        order_id: job.deliveryRequest?.order.id,
        customer_name: job.deliveryRequest?.order.customer?.name,
        delivery_address: job.deliveryRequest?.order.pickupAddress?.address,
        delivery_coordinates: `${job.deliveryRequest?.order.pickupAddress?.lat}, ${job.deliveryRequest?.order.pickupAddress?.lng}`,
        created_at: job.deliveryRequest?.created_at,
        updated_at: job.updated_at,
      }));

      return {
        success: true,
        message: "Completed Jobs fetched successfully",
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }
}
