import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { Prisma } from "@/generated/prisma/client";
import {
  OrderStatus,
  StationName,
  MismatchStatus,
} from "@/generated/prisma/enums";
import {
  AcceptOrderInputDTO,
  FetchWorkerOrdersDTO,
} from "@/validations/workerOrder.validation";

export class WorkerOrderService {
  async getAvailableOrders(
    workerId: string,
    outletId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
        select: { worker_station: true },
      });

      if (!worker || !worker.worker_station) {
        throw new HttpError(400, "User is not a station worker");
      }

      let statusCondition: Prisma.OrderWhereInput = {};

      if (worker.worker_station === "washing") {
        statusCondition = {
          status: "arrived_at_outlet",
          washing_worker_id: null,
          stationLogs: { none: { status: "pending", station: "washing" } }, // Don't show if there's a pending conflict
        };
      } else if (worker.worker_station === "ironing") {
        statusCondition = {
          washing_completed_at: { not: null },
          ironing_worker_id: null,
          stationLogs: { none: { status: "pending", station: "ironing" } },
        };
      } else if (worker.worker_station === "packing") {
        statusCondition = {
          ironing_completed_at: { not: null },
          packing_worker_id: null,
          stationLogs: { none: { status: "pending", station: "packing" } },
        };
      }

      const where: Prisma.OrderWhereInput = {
        outlet_id: outletId,
        ...statusCondition,
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: { item: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { created_at: "asc" },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: orders,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async acceptOrder(
    workerId: string,
    outletId: string,
    orderId: string,
    data: AcceptOrderInputDTO,
  ) {
    try {
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
        select: { worker_station: true },
      });

      if (!worker || !worker.worker_station) {
        throw new HttpError(400, "User is not a station worker");
      }

      const order = await prisma.order.findFirst({
        where: { id: orderId, outlet_id: outletId },
        include: { items: true },
      });

      if (!order) {
        throw new HttpError(404, "Order not found");
      }

      if (order.status === "finished" || order.status === "cancelled") {
        throw new HttpError(400, "Cannot accept a finished or cancelled order");
      }

      if (order.status === "delivered") {
        throw new HttpError(400, "Cannot accept a delivered order");
      }

      let hasMismatch = false;
      const logsToCreate: Prisma.OrderStationLogUncheckedCreateInput[] = [];
      const summariesToUpsert: {
        order_id: string;
        item_id: string;
        station: StationName;
        latest_quantity: number;
      }[] = [];

      for (const inputItem of data.items) {
        const orderItem = order.items.find(
          (i) => i.item_id === inputItem.itemId,
        );
        if (!orderItem) {
          throw new HttpError(
            400,
            `Item ${inputItem.itemId} not found in this order`,
          );
        }

        // We check against the current quantity. Note: Initial quantity is stored in `quantity_initial`,
        // but if there were updates from previous stations, they would be in StationSummary.
        // For simplicity, we check against quantity_initial or latest summary if we wanted to be strict.
        // Assuming we check against quantity_initial based on plan.
        if (inputItem.quantity !== orderItem.quantity_initial) {
          hasMismatch = true;
          logsToCreate.push({
            order_id: orderId,
            item_id: inputItem.itemId,
            station: worker.worker_station,
            worker_id: workerId,
            quantity_input: inputItem.quantity,
            status: MismatchStatus.pending,
          });
        } else {
          summariesToUpsert.push({
            order_id: orderId,
            item_id: inputItem.itemId,
            station: worker.worker_station,
            latest_quantity: inputItem.quantity,
          });
        }
      }

      if (hasMismatch) {
        // Create logs for admin approval, order status unchanged
        await prisma.orderStationLog.createMany({
          data: logsToCreate,
        });
        return { message: "Conflict detected. Waiting for admin approval." };
      }

      // No mismatch, proceed to accept order
      let nextStatus = order.status;
      const updateData: Prisma.OrderUpdateInput = {};

      if (worker.worker_station === "washing") {
        nextStatus = "washing_in_progress";
        updateData.washingWorker = { connect: { id: workerId } };
      } else if (worker.worker_station === "ironing") {
        nextStatus = "ironing_in_progress";
        updateData.ironingWorker = { connect: { id: workerId } };
      } else if (worker.worker_station === "packing") {
        nextStatus = "packing_in_progrees";
        updateData.packingWorker = { connect: { id: workerId } };
      }

      updateData.status = nextStatus;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: updateData,
        });

        for (const summary of summariesToUpsert) {
          await tx.stationSummary.upsert({
            where: {
              order_id_item_id_station: {
                order_id: summary.order_id,
                item_id: summary.item_id,
                station: summary.station,
              },
            },
            update: { latest_quantity: summary.latest_quantity },
            create: summary,
          });
        }
      });

      return { message: "Order accepted successfully" };
    } catch (error) {
      throw error;
    }
  }

  async completeOrder(workerId: string, outletId: string, orderId: string) {
    try {
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
        select: { worker_station: true },
      });

      if (!worker || !worker.worker_station) {
        throw new HttpError(400, "User is not a station worker");
      }

      const order = await prisma.order.findFirst({
        where: { id: orderId, outlet_id: outletId },
      });

      if (!order) {
        throw new HttpError(404, "Order not found");
      }

      if (order.status === "finished" || order.status === "cancelled") {
        throw new HttpError(
          400,
          "Cannot complete a finished or cancelled order",
        );
      }

      if (order.status === "delivered") {
        throw new HttpError(400, "Cannot complete a delivered order");
      }

      const updateData: Prisma.OrderUpdateInput = {};
      let nextStatus = order.status;

      if (worker.worker_station === "washing") {
        if (order.washing_worker_id !== workerId)
          throw new HttpError(403, "Not assigned to this order");
        updateData.washing_completed_at = new Date();
      } else if (worker.worker_station === "ironing") {
        if (order.ironing_worker_id !== workerId)
          throw new HttpError(403, "Not assigned to this order");
        updateData.ironing_completed_at = new Date();
      } else if (worker.worker_station === "packing") {
        if (order.packing_worker_id !== workerId)
          throw new HttpError(403, "Not assigned to this order");
        updateData.packing_completed_at = new Date();
        nextStatus = "waiting_for_payment"; // Default to this after packing
      }

      if (nextStatus !== order.status) {
        updateData.status = nextStatus;
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async getOrderHistory(
    workerId: string,
    outletId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const worker = await prisma.user.findUnique({
        where: { id: workerId },
        select: { worker_station: true },
      });

      if (!worker || !worker.worker_station) {
        throw new HttpError(400, "User is not a station worker");
      }

      let workerCondition: Prisma.OrderWhereInput = {};

      if (worker.worker_station === "washing") {
        workerCondition = {
          washing_worker_id: workerId,
          washing_completed_at: { not: null },
        };
      } else if (worker.worker_station === "ironing") {
        workerCondition = {
          ironing_worker_id: workerId,
          ironing_completed_at: { not: null },
        };
      } else if (worker.worker_station === "packing") {
        workerCondition = {
          packing_worker_id: workerId,
          packing_completed_at: { not: null },
        };
      }

      const where: Prisma.OrderWhereInput = {
        outlet_id: outletId,
        ...workerCondition,
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            items: {
              include: { item: true },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { updated_at: "desc" },
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: orders,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
