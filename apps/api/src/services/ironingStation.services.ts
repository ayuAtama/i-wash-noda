// src/services/ironingStation.services.ts
import { prisma } from "@/config/prisma";
import { StationName } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";

export class IroningStationServices {
  async getAllIroningOrders(outletId: string) {
    try {
      const availableJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          washing_completed_at: { not: null },
          ironing_worker_id: null,
        },
        select: { id: true, total_kilo: true, items: true, created_at: true },
        orderBy: { created_at: "asc" },
      });

      return availableJobs;
    } catch (error) {
      throw error;
    }
  }

  async acceptIroningJob(orderId: string, workerId: string, outletId: string) {
    try {
      const acceptIroningJob = await prisma.order.updateMany({
        where: {
          id: orderId,
          outlet_id: outletId,
          washing_completed_at: { not: null },
          ironing_worker_id: null,
        },
        data: {
          status: "ironing_in_progress",
          ironing_worker_id: workerId,
        },
      });

      if (acceptIroningJob.count === 0)
        throw new HttpError(
          409,
          "This job already assigned to another worker or unavailable.",
        );

      const result = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, total_kilo: true, items: true },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getActiveJobs(workerId: string, outletId: string) {
    try {
      const activeJobs = await prisma.order.findMany({
        where: {
          ironing_worker_id: workerId,
          status: "ironing_in_progress",
          outlet_id: outletId,
        },
        select: { id: true, total_kilo: true, items: true, created_at: true },
        orderBy: { created_at: "desc" },
      });

      return activeJobs;
    } catch (error) {
      throw error;
    }
  }

  async reInputItems(
    orderId: string,
    workerId: string,
    outletId: string,
    worker_station: string,
    data: {
      items: { itemId: string; quantity: number }[];
      missMatch: boolean;
    },
  ) {
    try {
      const { items, missMatch } = data;
      const workerStatus = worker_station as StationName;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          outlet_id: outletId,
          ironing_worker_id: workerId,
          status: "ironing_in_progress",
        },
        include: { items: true },
      });

      if (!order) {
        throw new HttpError(403, "You don't have access to this job");
      }

      const baselineItems = new Map(
        order.items.map((item) => [item.item_id, item.quantity_initial]),
      );

      const result = await prisma.$transaction(async (tx) => {
        if (items.length !== baselineItems.size) {
          throw new HttpError(400, "Invalid item inputted for this order");
        }

        const duplicate = new Set<string>();
        for (const input of items) {
          if (duplicate.has(input.itemId)) {
            throw new HttpError(400, "Duplicate item inputted for this order");
          }
          duplicate.add(input.itemId);
        }

        for (const input of items) {
          const expected = baselineItems.get(input.itemId);

          if (expected === undefined) {
            throw new HttpError(400, "Invalid item inputted for this order");
          }

          const isMatch = input.quantity === expected;
          if (!isMatch && !missMatch) {
            throw new HttpError(400, "Invalid quantity for this item");
          }

          const exists = await tx.stationSummary.findUnique({
            where: {
              order_id_item_id_station: {
                order_id: orderId,
                item_id: input.itemId,
                station: workerStatus,
              },
            },
          });

          if (exists) {
            throw new HttpError(
              409,
              "Reinput data already submitted for this item",
            );
          }

          await tx.orderStationLog.create({
            data: {
              order_id: orderId,
              item_id: input.itemId,
              station: workerStatus,
              worker_id: workerId,
              quantity_input: input.quantity,
              status: isMatch ? "approved" : "pending",
              ...(isMatch && {
                approved_by: workerId,
                approved_at: new Date(),
              }),
            },
          });

          if (isMatch) {
            await tx.stationSummary.create({
              data: {
                order_id: orderId,
                item_id: input.itemId,
                station: workerStatus,
                latest_quantity: input.quantity,
                updated_at: new Date(),
              },
            });
          }
        }

        const stationLog = await tx.orderStationLog.findMany({
          where: {
            order_id: orderId,
            station: workerStatus,
            worker_id: workerId,
          },
        });

        const stationSummary = await tx.stationSummary.findMany({
          where: { order_id: orderId, station: workerStatus },
        });

        if (!missMatch) {
          if (
            stationLog.length !== items.length ||
            stationSummary.length !== items.length
          ) {
            throw new HttpError(500, "Incomplete reinput write");
          }
        }

        if (missMatch) {
          if (stationLog.length !== items.length) {
            throw new HttpError(500, "Incomplete reinput write");
          }
        }

        return { stationLog, stationSummary };
      });
    } catch (error) {
      throw error;
    }
  }

  async markJobAsDone(
    orderId: string,
    workerId: string,
    outletId: string,
    worker_station: string,
  ) {
    try {
      const workerStatus = worker_station as StationName;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          outlet_id: outletId,
          ironing_worker_id: workerId,
          status: "ironing_in_progress",
          ironing_completed_at: null,
        },
        select: { id: true },
      });

      if (!order) {
        throw new HttpError(
          403,
          "You don't have access to this job or it is already completed",
        );
      }

      const [itemCount, ironingSummaryCount, blockingLogs] = await Promise.all([
        prisma.orderItem.count({
          where: { order_id: order.id },
        }),
        prisma.stationSummary.count({
          where: {
            order_id: order.id,
            station: workerStatus,
          },
        }),
        prisma.orderStationLog.count({
          where: {
            order_id: order.id,
            station: workerStatus,
            status: { in: ["pending", "rejected"] },
          },
        }),
      ]);

      const ironingDone =
        ironingSummaryCount === itemCount && blockingLogs === 0;

      if (!ironingDone) {
        if (ironingSummaryCount !== itemCount) {
          throw new HttpError(
            400,
            `Not all items have been processed (${ironingSummaryCount}/${itemCount})`,
          );
        }
        throw new HttpError(400, "Some items are still pending or rejected.");
      }

      const updateStatus = await prisma.order.updateMany({
        where: {
          id: order.id,
          ironing_worker_id: workerId,
          ironing_completed_at: null,
        },
        data: { ironing_completed_at: new Date() },
      });

      if (updateStatus.count === 0) {
        throw new HttpError(
          409,
          "Job was already marked as done by another process",
        );
      }

      const result = {
        success: true,
        message: "Job with id " + order.id + " was marked as done",
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getCompletedJobs(workerId: string, outletId: string) {
    try {
      const completedJobs = await prisma.order.findMany({
        where: {
          ironing_worker_id: workerId,
          outlet_id: outletId,
          status: { not: "ironing_in_progress" },
        },
        select: {
          id: true,
          total_kilo: true,
          updated_at: true,
          customer: { select: { name: true } },
        },
        orderBy: { updated_at: "desc" },
      });

      return completedJobs;
    } catch (error) {
      throw error;
    }
  }
}
