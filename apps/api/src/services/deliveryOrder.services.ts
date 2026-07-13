// src/services/deliveryOrder.services.ts
import { prisma } from "@/config/prisma";
import { DriverJobStatusEnum } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";
import { format } from "date-fns";

export class DeliveryOrderService {
  async getAllDeliveryRequests(
    userId: string,
    outletId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        accepted: false,
        order: {
          outlet_id: outletId,
          status: "waiting_for_driver_deliver" as const,
        },
      };

      const [deliveryRequests, total] = await Promise.all([
        prisma.deliveryRequest.findMany({
          where,
          select: {
            id: true,
            order_id: true,
            created_at: true,
            order: {
              select: {
                id: true,
                total_kilo: true,
                total_amount: true,
                customer: {
                  select: {
                    id: true,
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
          skip,
          take,
        }),
        prisma.deliveryRequest.count({ where }),
      ]);

      const result = deliveryRequests.map((dr) => ({
        id: dr.id,
        order_id: dr.order_id,
        customer_name: dr.order.customer?.name,
        customer_address: dr.order.pickupAddress?.address,
        customer_coordinates: dr.order.pickupAddress
          ? `${dr.order.pickupAddress.lat}, ${dr.order.pickupAddress.lng}`
          : null,
        outlet_name: dr.order.outlet.name,
        gmap_link: dr.order.pickupAddress
          ? `https://www.google.com/maps/dir/?api=1&destination=${dr.order.pickupAddress.lat},${dr.order.pickupAddress.lng}`
          : null,
        total_amount: dr.order.total_amount,
        created_at: format(dr.created_at, "MMMM do, yyyy 'at' h:mm a"),
      }));

      return {
        data: result,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async acceptDeliveryRequest(
    deliveryId: string,
    userId: string,
    outletId: string,
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const deliveryRequest = await tx.deliveryRequest.findUnique({
          where: { id: deliveryId },
          include: {
            order: { select: { outlet_id: true, status: true } },
          },
        });

        if (!deliveryRequest) {
          throw new HttpError(404, "Delivery request not found");
        }
        if (deliveryRequest.order.outlet_id !== outletId) {
          throw new HttpError(400, "Outlet mismatch");
        }
        if (deliveryRequest.accepted) {
          throw new HttpError(400, "Already accepted");
        }

        const updatedDelivery = await tx.deliveryRequest.update({
          where: { id: deliveryId, accepted: false },
          data: { driver_id: userId, accepted: true },
        });

        await tx.order.update({
          where: { id: updatedDelivery.order_id },
          data: {
            driver_delivery_id: userId,
            status: "out_for_delivery",
          },
        });

        await tx.driverJobStatus.create({
          data: {
            driver_id: userId,
            delivery_request_id: updatedDelivery.id,
            status: "in_transit",
          },
        });

        return {
          success: true,
          message: "Delivery request accepted successfully",
          data: {
            order_id: updatedDelivery.order_id,
            accepted: format(Date.now(), "MMMM do, yyyy 'at' h:mm a"),
          },
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateDeliveryStatus(userId: string, deliveryId: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const driverStatus = await tx.driverJobStatus.findUnique({
          where: { delivery_request_id: deliveryId, driver_id: userId },
        });

        if (!driverStatus) throw new HttpError(404, "This job not found");

        if (driverStatus.status === "in_transit") {
          return await tx.driverJobStatus.update({
            where: { delivery_request_id: deliveryId, driver_id: userId },
            data: { status: "on_delivery", updated_at: new Date() },
          });
        }

        if (driverStatus.status === "on_delivery") {
          const updated = await tx.driverJobStatus.update({
            where: { delivery_request_id: deliveryId, driver_id: userId },
            data: { status: "done", updated_at: new Date() },
          });

          const delivery = await tx.deliveryRequest.findUnique({
            where: { id: deliveryId, driver_id: userId },
          });

          if (delivery?.order_id) {
            await tx.order.update({
              where: { id: delivery.order_id },
              data: {
                status: "delivered",
                delivered_at: new Date(),
              },
            });
          }

          return updated;
        }

        if (driverStatus.status === "done") {
          throw new HttpError(400, "This job already done");
        }
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAcceptedDeliveries(
    userId: string,
    outletId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        driver_id: userId,
        delivery_request_id: { not: null },
        status: { not: "done" as const },
        deliveryRequest: {
          order: { outlet_id: outletId },
        },
      };

      const [jobs, total] = await Promise.all([
        prisma.driverJobStatus.findMany({
          where,
          select: {
            id: true,
            status: true,
            updated_at: true,
            deliveryRequest: {
              select: {
                id: true,
                order: {
                  select: {
                    id: true,
                    total_amount: true,
                    customer: { select: { name: true } },
                    outlet: { select: { name: true } },
                    pickupAddress: {
                      select: { address: true, lat: true, lng: true },
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

      const flattened = jobs.map((job) => ({
        delivery_id: job.deliveryRequest?.id,
        status: job.status,
        updated_at: job.updated_at,
        order: job.deliveryRequest?.order,
      }));

      return {
        data: flattened,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async getCompletedDeliveries(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        driver_id: userId,
        delivery_request_id: { not: null },
        status: "done" as const,
      };

      const [jobs, total] = await Promise.all([
        prisma.driverJobStatus.findMany({
          where,
          select: {
            id: true,
            status: true,
            updated_at: true,
            deliveryRequest: {
              select: {
                id: true,
                order: {
                  select: {
                    id: true,
                    total_amount: true,
                    total_kilo: true,
                    status: true,
                    customer: { select: { name: true } },
                    outlet: { select: { name: true, address: true } },
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
