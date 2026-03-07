// src/services/washingStation.services.ts
import { prisma } from "@/config/prisma";
import { StationName } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";

export class WashingStationServices {
  async getAllWashingOrders(outletId: string) {
    try {
      // fetch all the orders
      const availableJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "arrived_at_outlet",
          washing_worker_id: null,
        },
        select: { id: true, total_kilo: true, items: true, created_at: true },
        orderBy: { created_at: "asc" },
      });

      return availableJobs;
    } catch (error) {
      throw error;
    }
  }

  async acceptWashingJob(orderId: string, workerId: string, outletId: string) {
    try {
      // accept the job
      const accecptWashingJob = await prisma.order.updateMany({
        where: {
          id: orderId,
          outlet_id: outletId,
          status: "arrived_at_outlet",
          washing_worker_id: null, // important prevent race condition and use updateMany instead of update
        },
        data: {
          status: "washing_in_progress",
          washing_worker_id: workerId,
        },
      });

      // condition if the job is already assigned
      if (accecptWashingJob.count === 0)
        throw new HttpError(
          409,
          "This job already assigned to another worker or unavailable."
        );

      // requery because the data won't be returned if use updateMany (only has count)
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
          washing_worker_id: workerId,
          status: "washing_in_progress",
          outlet_id: outletId,
        },
        select: { id: true, total_kilo: true, items: true, created_at: true },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      throw error;
    }
  }

  async reInputItems(
    orderId: string, // params
    workerId: string, // jwt
    outletId: string, // req.contex
    worker_station: string, // req.contex
    data: {
      items: { itemId: string; quantity: number }[];
      missMatch: boolean;
    }
  ) {
    try {
      const { items, missMatch } = data;

      // check in enum prisma
      const workerStatus = worker_station as StationName;
      // validate the job ownerships
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          outlet_id: outletId,
          washing_worker_id: workerId,
          status: "washing_in_progress",
        },
        include: { items: true },
      });

      if (!order) {
        throw new HttpError(403, "You don't have access to this job");
      }

      // baseline item to compare to (admin input's id)
      const baselineItems = new Map(
        order.items.map((item) => [item.item_id, item.quantity_initial])
      );

      // process the inputted items in transactions
      const result = await prisma.$transaction(async (tx) => {
        // check if the item length sama
        if (items.length !== baselineItems.size) {
          throw new HttpError(400, "Invalid item inputted for this order");
        }

        // check duplicate guard before the loop
        const duplicate = new Set<string>();
        for (const input of items) {
          if (duplicate.has(input.itemId)) {
            throw new HttpError(400, "Duplicate item inputted for this order");
          }
          duplicate.add(input.itemId);
        }

        // loop through the inputted items
        for (const input of items) {
          // get the item id
          const expected = baselineItems.get(input.itemId);

          // check the item id
          if (expected === undefined) {
            throw new HttpError(400, "Invalid item inputted for this order");
          }

          // check the quantity input into the expected (from map)
          // return invalid if not match and throw (checklis not checked)
          const isMatch = input.quantity === expected;
          if (!isMatch && !missMatch) {
            throw new HttpError(400, "Invalid quantity for this item");
          }

          // prevent the double input for reinput
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
              "Reinput data already submitted for this item"
            );
          }

          // create the log first
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

          // create the summary if MATCH
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

        // requery the result for station log and summary if match
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

        // if falled to requery
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
    worker_station: string // enum req.contex
  ) {
    try {
      // validate the workerstatus enum
      const workerStatus = worker_station as StationName;
      // validate the job ownerships
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          outlet_id: outletId,
          washing_worker_id: workerId,
          status: "washing_in_progress",
          washing_completed_at: null,
        },
        select: { id: true },
      });

      if (!order) {
        throw new HttpError(
          403,
          "You don't have access to this job or it is already completed"
        );
      }

      // independent checks in parallel (Faster) || position matters array destructuring
      const [itemCount, washingSummaryCount, blockingLogs] = await Promise.all([
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

      // check if all items are approved
      const washingDone =
        washingSummaryCount === itemCount && blockingLogs === 0;

      if (!washingDone) {
        // Be specific about why it failed for better debugging
        if (washingSummaryCount !== itemCount) {
          throw new HttpError(
            400,
            `Not all items have been processed (${washingSummaryCount}/${itemCount})`
          );
        }
        throw new HttpError(400, "Some items are still pending or rejected.");
      }

      // mark the order as done so can pass to another station
      const updateStatus = await prisma.order.updateMany({
        where: {
          id: order.id,
          washing_worker_id: workerId,
          washing_completed_at: null, // race condition check
        },
        data: { washing_completed_at: new Date() },
      });

      if (updateStatus.count === 0) {
        throw new HttpError(
          409,
          "Job was already marked as done by another process"
        );
      }

      const result = {
        succes: true,
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
          washing_worker_id: workerId,
          outlet_id: outletId,
          status: { not: "washing_in_progress" },
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
