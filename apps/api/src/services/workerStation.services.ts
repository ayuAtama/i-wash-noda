// /api/src/services/workerStation.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  MismatchStatus,
  OrderStatus,
  StationName,
  WorkerStation,
} from "@/generated/prisma/client";
import WorkerStationStrategy from "@/types/workerStationStrategy";
import {
  AssignJobServiceMethodDTO,
  AssignJobServiceStrategyDTO,
  CheckActiveJobsPayloadDTO,
  checkActiveJobsStrategyDTO,
  CheckAvailableJobsPayloadDTO,
  GetCompleteJobsMethodDTO,
  GetCompleteJobsStrategyDTO,
  MarkDoneServiceMethodDTO,
  MarkDoneServiceStrategyDTO,
  OutletIDPayloadDTO,
  ReInputServiceMethodPayloadDTO,
  ReInputServiceStrategyPayloadDTO,
} from "@/validations/workerStation.validation";

export class WorkerStationService {
  private strategies: Record<WorkerStation, WorkerStationStrategy> = {
    washing: new WashingService(),
    ironing: new IroningService(),
    packing: new PackingService(),
  };

  async checkAvailableJobs(data: CheckAvailableJobsPayloadDTO) {
    try {
      const { worker_station, outlet_id } = data;

      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      return await strategy.checkAvailableJobs(outlet_id);
    } catch (error) {
      throw error;
    }
  }

  async checkActiveJobs(data: CheckActiveJobsPayloadDTO) {
    try {
      const { worker_station, outlet_id, worker_id } = data;

      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      return await strategy.checkActiveJobs({
        outletId: outlet_id,
        workerId: worker_id,
      });
    } catch (error) {
      throw error;
    }
  }

  async assignJob(data: AssignJobServiceStrategyDTO) {
    try {
      const { workerStation: worker_station, ...rest } = data;

      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      return await strategy.assignJob(rest);
    } catch (error) {
      throw error;
    }
  }

  async reInputItem(data: ReInputServiceStrategyPayloadDTO) {
    try {
      // destructure the data
      const {
        workerStation: worker_station,
        // userId,
        // outletId,
        // orderId,
        // items,
      } = data;

      // register the worker_station into strategies
      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      return await strategy.reInputItem(data);
    } catch (err) {
      throw err;
    }
  }

  async markDone(data: MarkDoneServiceStrategyDTO) {
    try {
      const { workerStation: worker_station, ...rest } = data;

      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      return await strategy.markDone(rest);
    } catch (error) {
      throw error;
    }
  }

  async getCompleteJobs(data: GetCompleteJobsStrategyDTO) {
    try {
      const { workerStation: worker_station, ...rest } = data;

      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      return await strategy.getCompleteJobs(rest);
    } catch (error) {
      throw error;
    }
  }
}

class WashingService implements WorkerStationStrategy {
  async checkAvailableJobs(outletId: OutletIDPayloadDTO["outlet_id"]) {
    try {
      const availableJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "washing_in_progress",
          washing_worker_id: null,
          OR: [
            { customer_id: { not: null } },
            { walkin_customer_id: { not: null } },
          ],
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: {
            select: {
              name: true,
            },
          },
          walkInCustomer: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updated_at: "asc",
        },
      });

      // normalize the name
      const normalize = availableJobs.map(
        ({ customer, walkInCustomer, ...rest }) => {
          const customer_name = customer?.name ?? walkInCustomer?.name;
          if (!customer_name) {
            throw new HttpError(400, "Customer name not found");
          }

          return {
            ...rest,
            customer_name,
          };
        },
      );

      // return the available jobs
      return {
        success: true,
        message: "Available jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkActiveJobs(data: checkActiveJobsStrategyDTO) {
    try {
      const { outletId, workerId } = data;

      const activeJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "washing_in_progress",
          washing_worker_id: workerId,
          OR: [
            { customer_id: { not: null } },
            { walkin_customer_id: { not: null } },
          ],
          washing_completed_at: null,
          ironing_completed_at: null,
          packing_completed_at: null,
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
      });

      // normalize the name
      const normalize = activeJobs.map(
        ({ customer, walkInCustomer, ...rest }) => {
          const customer_name = customer?.name ?? walkInCustomer?.name;
          if (!customer_name) {
            throw new HttpError(400, "Customer name not found");
          }

          return {
            ...rest,
            customer_name,
          };
        },
      );

      return {
        success: true,
        message: "Active jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async assignJob(data: AssignJobServiceMethodDTO) {
    try {
      const { userId, outletId, orderId } = data;

      const assignedJob = await prisma.order.updateMany({
        where: {
          id: orderId,
          outlet_id: outletId,
          status: "washing_in_progress" as OrderStatus,
          washing_worker_id: null,
        },
        data: {
          washing_worker_id: userId,
        },
      });

      if (assignedJob.count === 0)
        throw new HttpError(
          409,
          "This job already assigned to another worker or unavailable.",
        );

      return {
        success: true,
        message: "Job assigned successfully",
        data: `Order ID: ${orderId}`,
      };
    } catch (error) {
      throw error;
    }
  }

  async reInputItem(data: ReInputServiceMethodPayloadDTO) {
    try {
      const {
        orderId: order_id,
        userId: worker_id,
        items,
        workerStation: worker_station,
      } = data;

      // validation for user author
      const valid = await prisma.order.findFirst({
        where: {
          id: order_id,
          washing_worker_id: worker_id,
        },
      });
      if (!valid)
        throw new HttpError(401, "Please don't edit other worker's job");
      // validation for already submitted items
      const existingLogs = await prisma.orderStationLog.findFirst({
        where: {
          order_id,
          station: worker_station,
        },
      });
      if (existingLogs) {
        if (existingLogs.status === "approved") {
          throw new HttpError(400, "Items already submitted and approved.");
        }

        if (existingLogs.status === "pending") {
          throw new HttpError(
            400,
            "Items already submitted. Waiting for admin approval.",
          );
        }
      }

      const actualItem = await prisma.orderItem.findMany({
        where: {
          order_id,
        },
        select: {
          item_id: true,
          quantity_initial: true,
        },
      });

      // compare the submitted item with the actual item
      // filter the correct first
      const correctItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          return actualItem.some(
            (dbItem: { item_id: string; quantity_initial: number }) => {
              return (
                dbItem.item_id === payload.itemId &&
                dbItem.quantity_initial === payload.itemQuantity
              );
            },
          );
        },
      );

      // filter the item with incorrect quantity
      const incorrectItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          const databaseItem = actualItem.find(
            (dbItems: { item_id: string; quantity_initial: number }) => {
              return dbItems.item_id === payload.itemId;
            },
          );

          if (!databaseItem) {
            return false;
          }

          return databaseItem.quantity_initial !== payload.itemQuantity;
        },
      );

      // filter item not exist on database
      const notExistItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          // look for the same id
          const databaseItem = actualItem.find(
            (dbItems: { item_id: string; quantity_initial: number }) => {
              return dbItems.item_id === payload.itemId;
            },
          );

          // if not found, it means not exist (undefined)
          return !databaseItem;
        },
      );

      // filter the lost item in database
      const lostItem = actualItem.filter(
        (dbItem: { item_id: string; quantity_initial: number }) => {
          const itemInPayload = items.find(
            (payload: { itemId: string; itemQuantity: number }) => {
              return dbItem.item_id === payload.itemId;
            },
          );

          // if not found, it means the item lost
          return !itemInPayload;
        },
      );

      const lostItems = lostItem.map((item) => {
        return {
          itemId: item.item_id,
          itemQuantity: item.quantity_initial,
        };
      });

      // auto send the items to station Log if the item same
      if (correctItems.length === actualItem.length) {
        // make the payload
        const dataStationSummary = correctItems.map((item) => {
          return {
            order_id: order_id,
            item_id: item.itemId,
            latest_quantity: item.itemQuantity,
            station: worker_station,
          };
        });

        const dataStationLog = dataStationSummary.map((item) => {
          return {
            order_id: item.order_id,
            item_id: item.item_id,
            station: item.station,
            worker_id: worker_id,
            quantity_input: item.latest_quantity,
            status: "approved" as MismatchStatus,
            admin_note: "Auto Approved because the item match!",
          };
        });

        const result = await prisma.$transaction(async (tx) => {
          const stationLog = await tx.orderStationLog.createManyAndReturn({
            data: dataStationLog,
          });

          const stationSummary = await tx.stationSummary.createManyAndReturn({
            data: dataStationSummary,
          });

          return {
            stationLog,
            stationSummary,
          };
        });

        return {
          success: true,
          message: "Item re-input successfully",
          data: {
            match: result.stationLog.map((log) => ({
              itemId: log.item_id,
              quantity: log.quantity_input,
            })),
          },
        };
      } else {
        const [
          normalizeCorrectItems,
          normalizeIncorrectItems,
          normalizeNotExistItems,
          normalizeLostItems,
        ] = [correctItems, incorrectItems, notExistItems, lostItems].map(
          (arrays: Array<{ itemId: string; itemQuantity: number }>) => {
            return arrays.map(
              ({
                itemId,
                itemQuantity,
              }: {
                itemId: string;
                itemQuantity: number;
              }) => ({
                order_id: order_id as string,
                item_id: itemId,
                station: "washing" as StationName,
                worker_id: worker_id as string,
                quantity_input: itemQuantity,
                status: "pending" as MismatchStatus,
              }),
            );
          },
        );

        const [correct, incorrect, notExist, lost] = await prisma.$transaction([
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeCorrectItems.map((item) => ({
              ...item,
              admin_note: "match",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeIncorrectItems.map((item) => ({
              ...item,
              admin_note: "mismatch",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeNotExistItems.map((item) => ({
              ...item,
              admin_note: "new",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeLostItems.map((item) => ({
              ...item,
              admin_note: "lost",
            })),
          }),
        ]);

        return {
          success: false,
          message: "Item re-input failed waiting for admin approval",
          data: {
            match: correct.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            mismatch: incorrect.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            new: notExist.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            lost: lost.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async markDone(data: MarkDoneServiceMethodDTO) {
    try {
      const { orderId, userId: workerId, outletId } = data;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          washing_worker_id: workerId,
          outlet_id: outletId,
        },
        select: {
          status: true,
        },
      });

      if (!order) {
        throw new HttpError(400, "This job is not assigned to you");
      }
      if (order.status === "ironing_in_progress") {
        throw new HttpError(400, "You've already completed this job");
      }

      const pending = await prisma.orderStationLog.findMany({
        where: {
          order_id: orderId,
          worker_id: workerId,
          station: "washing" as StationName,
          status: "pending" as MismatchStatus,
        },
      });

      if (pending.length > 0) {
        throw new HttpError(
          400,
          "Failed to mark completed, there are pending item re-input waiting for admin approval",
        );
      }

      const complete = await prisma.order.update({
        where: {
          id: orderId,
          outlet_id: outletId,
          washing_worker_id: workerId,
        },
        data: {
          washing_completed_at: new Date(),
          status: "ironing_in_progress" as OrderStatus,
          ironing_worker_id: null,
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
      });

      const { customer, walkInCustomer, ...rest } = complete;
      const customerName = customer?.name ?? walkInCustomer?.name;
      if (!customerName) {
        throw new HttpError(400, "Customer name not found");
      }

      const normalized = {
        ...rest,
        customer_name: customerName,
      };

      return {
        success: true,
        message: "Washing job completed",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCompleteJobs(data: GetCompleteJobsMethodDTO) {
    try {
      const { outletId, workerId } = data;

      const completeJobs = await prisma.order.findMany({
        where: {
          washing_worker_id: workerId,
          outlet_id: outletId,
          status: {
            not: "washing_in_progress",
          },
          washing_completed_at: {
            not: null,
          },
        },
        select: {
          id: true,
          customer: {
            select: {
              name: true,
            },
          },
          walkInCustomer: {
            select: {
              name: true,
            },
          },
          washing_completed_at: true,
        },
        orderBy: {
          washing_completed_at: "desc",
        },
      });

      const normalized = completeJobs.map((job) => {
        const customerName =
          job.customer?.name ?? job.walkInCustomer?.name ?? "";
        return {
          id: job.id,
          customerName,
          completedAt: job.washing_completed_at,
        };
      });

      return {
        success: true,
        message: "Get complete jobs successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }
}

class IroningService implements WorkerStationStrategy {
  async checkAvailableJobs(outletId: OutletIDPayloadDTO["outlet_id"]) {
    try {
      const availableJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "ironing_in_progress",
          ironing_worker_id: null,
          washing_completed_at: { not: null },
          OR: [
            { customer_id: { not: null } },
            { walkin_customer_id: { not: null } },
          ],
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
        orderBy: {
          updated_at: "asc",
        },
      });

      // normalize the name
      const normalize = availableJobs.map(
        ({ customer, walkInCustomer, ...rest }) => {
          const customer_name = customer?.name ?? walkInCustomer?.name;
          if (!customer_name) {
            throw new HttpError(400, "Customer name not found");
          }

          return {
            ...rest,
            customer_name,
          };
        },
      );

      // return the available jobs
      return {
        success: true,
        message: "Available jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkActiveJobs(data: checkActiveJobsStrategyDTO) {
    try {
      const { outletId, workerId } = data;

      const activeJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "ironing_in_progress",
          ironing_worker_id: workerId,
          OR: [
            { customer_id: { not: null } },
            { walkin_customer_id: { not: null } },
          ],
          washing_completed_at: { not: null },
          ironing_completed_at: null,
          packing_completed_at: null,
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
      });

      // normalize the name
      const normalize = activeJobs.map(
        ({ customer, walkInCustomer, ...rest }) => {
          const customer_name = customer?.name ?? walkInCustomer?.name;
          if (!customer_name) {
            throw new HttpError(400, "Customer name not found");
          }

          return {
            ...rest,
            customer_name,
          };
        },
      );

      return {
        success: true,
        message: "Active jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async assignJob(data: AssignJobServiceMethodDTO) {
    try {
      const { userId, outletId, orderId } = data;

      const assignedJob = await prisma.order.updateMany({
        where: {
          id: orderId,
          outlet_id: outletId,
          status: "ironing_in_progress" as OrderStatus,
          washing_completed_at: { not: null },
          ironing_worker_id: null,
        },
        data: {
          ironing_worker_id: userId,
        },
      });

      if (assignedJob.count === 0)
        throw new HttpError(
          409,
          "This job already assigned to another worker or unavailable.",
        );

      return {
        success: true,
        message: "Job assigned successfully",
        data: `Order ID: ${orderId}`,
      };
    } catch (error) {
      throw error;
    }
  }

  async reInputItem(data: ReInputServiceMethodPayloadDTO) {
    try {
      const {
        orderId: order_id,
        userId: worker_id,
        items,
        workerStation: worker_station,
      } = data;

      // validation for user author
      const valid = await prisma.order.findFirst({
        where: {
          id: order_id,
          ironing_worker_id: worker_id,
        },
      });
      if (!valid)
        throw new HttpError(401, "Please don't edit other worker's job");
      // validation for already submitted items
      const existingLogs = await prisma.orderStationLog.findFirst({
        where: {
          order_id,
          station: worker_station,
        },
      });
      if (existingLogs) {
        if (existingLogs.status === "approved") {
          throw new HttpError(400, "Items already submitted and approved.");
        }

        if (existingLogs.status === "pending") {
          throw new HttpError(
            400,
            "Items already submitted. Waiting for admin approval.",
          );
        }
      }

      const previousStationItems = await prisma.stationSummary.findMany({
        where: {
          order_id,
          station: "washing" as StationName,
        },
        select: {
          item_id: true,
          latest_quantity: true,
        },
      });

      const correctItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          return previousStationItems.some(
            (dbItem: { item_id: string; latest_quantity: number }) => {
              return (
                dbItem.item_id === payload.itemId &&
                dbItem.latest_quantity === payload.itemQuantity
              );
            },
          );
        },
      );

      const incorrectItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          const databaseItem = previousStationItems.find(
            (dbItems: { item_id: string; latest_quantity: number }) => {
              return dbItems.item_id === payload.itemId;
            },
          );

          if (!databaseItem) {
            return false;
          }

          return databaseItem.latest_quantity !== payload.itemQuantity;
        },
      );

      const notExistItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          const databaseItem = previousStationItems.find(
            (dbItems: { item_id: string; latest_quantity: number }) => {
              return dbItems.item_id === payload.itemId;
            },
          );

          return !databaseItem;
        },
      );

      const lostItem = previousStationItems.filter(
        (dbItem: { item_id: string; latest_quantity: number }) => {
          const itemInPayload = items.find(
            (payload: { itemId: string; itemQuantity: number }) => {
              return dbItem.item_id === payload.itemId;
            },
          );

          return !itemInPayload;
        },
      );

      const lostItems = lostItem.map((item) => {
        return {
          itemId: item.item_id,
          itemQuantity: item.latest_quantity,
        };
      });

      if (correctItems.length === previousStationItems.length) {
        const dataStationSummary = correctItems.map((item) => {
          return {
            order_id: order_id,
            item_id: item.itemId,
            latest_quantity: item.itemQuantity,
            station: "ironing" as StationName,
          };
        });

        const dataStationLog = dataStationSummary.map((item) => {
          return {
            order_id: item.order_id,
            item_id: item.item_id,
            station: item.station,
            worker_id: worker_id,
            quantity_input: item.latest_quantity,
            status: "approved" as MismatchStatus,
            admin_note: "Auto Approved because the item match!",
          };
        });

        const result = await prisma.$transaction(async (tx) => {
          const stationLog = await tx.orderStationLog.createManyAndReturn({
            data: dataStationLog,
          });

          const stationSummary = await tx.stationSummary.createManyAndReturn({
            data: dataStationSummary,
          });

          return {
            stationLog,
            stationSummary,
          };
        });

        return {
          success: true,
          message: "Item re-input successfully",
          data: {
            match: result.stationLog.map((log) => ({
              itemId: log.item_id,
              quantity: log.quantity_input,
            })),
          },
        };
      } else {
        const [
          normalizeCorrectItems,
          normalizeIncorrectItems,
          normalizeNotExistItems,
          normalizeLostItems,
        ] = [correctItems, incorrectItems, notExistItems, lostItems].map(
          (arrays: Array<{ itemId: string; itemQuantity: number }>) => {
            return arrays.map(
              ({
                itemId,
                itemQuantity,
              }: {
                itemId: string;
                itemQuantity: number;
              }) => ({
                order_id: order_id as string,
                item_id: itemId,
                station: worker_station as StationName,
                worker_id: worker_id as string,
                quantity_input: itemQuantity,
                status: "pending" as MismatchStatus,
              }),
            );
          },
        );

        const [correct, incorrect, notExist, lost] = await prisma.$transaction([
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeCorrectItems.map((item) => ({
              ...item,
              admin_note: "match",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeIncorrectItems.map((item) => ({
              ...item,
              admin_note: "mismatch",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeNotExistItems.map((item) => ({
              ...item,
              admin_note: "new",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeLostItems.map((item) => ({
              ...item,
              admin_note: "lost",
            })),
          }),
        ]);

        return {
          success: false,
          message: "Item re-input failed waiting for admin approval",
          data: {
            match: correct.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            mismatch: incorrect.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            new: notExist.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            lost: lost.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async markDone(data: MarkDoneServiceMethodDTO) {
    try {
      const { orderId, userId: workerId, outletId } = data;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          ironing_worker_id: workerId,
          outlet_id: outletId,
        },
        select: {
          status: true,
        },
      });

      if (!order) {
        throw new HttpError(400, "This job is not assigned to you");
      }
      if (order.status === "packing_in_progress") {
        throw new HttpError(400, "You've already completed this job");
      }

      const pending = await prisma.orderStationLog.findMany({
        where: {
          order_id: orderId,
          worker_id: workerId,
          station: "ironing" as StationName,
          status: "pending" as MismatchStatus,
        },
      });

      if (pending.length > 0) {
        throw new HttpError(
          400,
          "Failed to mark completed, there are pending item re-input waiting for admin approval",
        );
      }

      const complete = await prisma.order.update({
        where: {
          id: orderId,
          outlet_id: outletId,
          ironing_worker_id: workerId,
        },
        data: {
          ironing_completed_at: new Date(),
          status: "packing_in_progress" as OrderStatus,
          packing_worker_id: null,
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
      });

      const { customer, walkInCustomer, ...rest } = complete;
      const customerName = customer?.name ?? walkInCustomer?.name;
      if (!customerName) {
        throw new HttpError(400, "Customer name not found");
      }

      const normalized = {
        ...rest,
        customer_name: customerName,
      };

      return {
        success: true,
        message: "Ironing job completed",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCompleteJobs(data: GetCompleteJobsMethodDTO) {
    try {
      const { outletId, workerId } = data;

      const completeJobs = await prisma.order.findMany({
        where: {
          ironing_worker_id: workerId,
          outlet_id: outletId,
          status: {
            not: "ironing_in_progress",
          },
          ironing_completed_at: {
            not: null,
          },
        },
        select: {
          id: true,
          customer: {
            select: {
              name: true,
            },
          },
          walkInCustomer: {
            select: {
              name: true,
            },
          },
          ironing_completed_at: true,
        },
        orderBy: {
          ironing_completed_at: "desc",
        },
      });

      const normalized = completeJobs.map((job) => {
        const customerName =
          job.customer?.name ?? job.walkInCustomer?.name ?? "";
        return {
          id: job.id,
          customerName,
          completedAt: job.ironing_completed_at,
        };
      });

      return {
        success: true,
        message: "Get complete jobs successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }
}

class PackingService implements WorkerStationStrategy {
  async checkAvailableJobs(outletId: OutletIDPayloadDTO["outlet_id"]) {
    try {
      const availableJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "packing_in_progress",
          packing_worker_id: null,
          washing_completed_at: { not: null },
          ironing_completed_at: { not: null },
          OR: [
            { customer_id: { not: null } },
            { walkin_customer_id: { not: null } },
          ],
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
        orderBy: {
          updated_at: "asc",
        },
      });

      // normalize the name
      const normalize = availableJobs.map(
        ({ customer, walkInCustomer, ...rest }) => {
          const customer_name = customer?.name ?? walkInCustomer?.name;
          if (!customer_name) {
            throw new HttpError(400, "Customer name not found");
          }

          return {
            ...rest,
            customer_name,
          };
        },
      );

      return {
        success: true,
        message: "Available jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkActiveJobs(data: checkActiveJobsStrategyDTO) {
    try {
      const { outletId, workerId } = data;

      const activeJobs = await prisma.order.findMany({
        where: {
          outlet_id: outletId,
          status: "packing_in_progress",
          packing_worker_id: workerId,
          OR: [
            { customer_id: { not: null } },
            { walkin_customer_id: { not: null } },
          ],
          washing_completed_at: { not: null },
          ironing_completed_at: { not: null },
          packing_completed_at: null,
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
      });

      // normalize the name
      const normalize = activeJobs.map(
        ({ customer, walkInCustomer, ...rest }) => {
          const customer_name = customer?.name ?? walkInCustomer?.name;
          if (!customer_name) {
            throw new HttpError(400, "Customer name not found");
          }

          return {
            ...rest,
            customer_name,
          };
        },
      );

      return {
        success: true,
        message: "Active jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async assignJob(data: AssignJobServiceMethodDTO) {
    try {
      const { userId, outletId, orderId } = data;

      const assignedJob = await prisma.order.updateMany({
        where: {
          id: orderId,
          outlet_id: outletId,
          status: "packing_in_progress" as OrderStatus,
          washing_completed_at: { not: null },
          ironing_completed_at: { not: null },
          packing_worker_id: null,
        },
        data: {
          packing_worker_id: userId,
        },
      });

      if (assignedJob.count === 0)
        throw new HttpError(
          409,
          "This job already assigned to another worker or unavailable.",
        );

      return {
        success: true,
        message: "Job assigned successfully",
        data: `Order ID: ${orderId}`,
      };
    } catch (error) {
      throw error;
    }
  }

  async reInputItem(data: ReInputServiceMethodPayloadDTO) {
    try {
      const {
        orderId: order_id,
        userId: worker_id,
        items,
        workerStation: worker_station,
      } = data;

      // validation for user author
      const valid = await prisma.order.findFirst({
        where: {
          id: order_id,
          packing_worker_id: worker_id,
        },
      });
      if (!valid)
        throw new HttpError(401, "Please don't edit other worker's job");

      // validation for already submitted items
      const existingLogs = await prisma.orderStationLog.findFirst({
        where: {
          order_id,
          station: "packing" as StationName,
        },
        select: {
          status: true,
        },
      });
      if (existingLogs) {
        if (existingLogs.status === "approved") {
          throw new HttpError(400, "Items already submitted and approved.");
        }
        if (existingLogs.status === "pending") {
          throw new HttpError(
            400,
            "Items already submitted. Waiting for admin approval",
          );
        }
      }

      const previousStationItems = await prisma.stationSummary.findMany({
        where: {
          order_id,
          station: "ironing" as StationName,
        },
        select: {
          item_id: true,
          latest_quantity: true,
        },
      });

      const correctItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          return previousStationItems.some(
            (dbItem: { item_id: string; latest_quantity: number }) => {
              return (
                dbItem.item_id === payload.itemId &&
                dbItem.latest_quantity === payload.itemQuantity
              );
            },
          );
        },
      );

      const incorrectItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          const databaseItem = previousStationItems.find(
            (dbItems: { item_id: string; latest_quantity: number }) => {
              return dbItems.item_id === payload.itemId;
            },
          );

          if (!databaseItem) {
            return false;
          }

          return databaseItem.latest_quantity !== payload.itemQuantity;
        },
      );

      const notExistItems = items.filter(
        (payload: { itemId: string; itemQuantity: number }) => {
          const databaseItem = previousStationItems.find(
            (dbItems: { item_id: string; latest_quantity: number }) => {
              return dbItems.item_id === payload.itemId;
            },
          );

          return !databaseItem;
        },
      );

      const lostItem = previousStationItems.filter(
        (dbItem: { item_id: string; latest_quantity: number }) => {
          const itemInPayload = items.find(
            (payload: { itemId: string; itemQuantity: number }) => {
              return dbItem.item_id === payload.itemId;
            },
          );

          return !itemInPayload;
        },
      );

      const lostItems = lostItem.map((item) => {
        return {
          itemId: item.item_id,
          itemQuantity: item.latest_quantity,
        };
      });

      if (correctItems.length === previousStationItems.length) {
        const dataStationSummary = correctItems.map((item) => {
          return {
            order_id: order_id,
            item_id: item.itemId,
            latest_quantity: item.itemQuantity,
            station: "packing" as StationName,
          };
        });

        const dataStationLog = dataStationSummary.map((item) => {
          return {
            order_id: item.order_id,
            item_id: item.item_id,
            station: item.station,
            worker_id: worker_id,
            quantity_input: item.latest_quantity,
            status: "approved" as MismatchStatus,
            admin_note: "Auto Approved because the item match!",
          };
        });

        const result = await prisma.$transaction(async (tx) => {
          const stationLog = await tx.orderStationLog.createManyAndReturn({
            data: dataStationLog,
          });

          const stationSummary = await tx.stationSummary.createManyAndReturn({
            data: dataStationSummary,
          });

          return {
            stationLog,
            stationSummary,
          };
        });

        return {
          success: true,
          message: "Item re-input successfully",
          data: {
            match: result.stationLog.map((log) => ({
              itemId: log.item_id,
              quantity: log.quantity_input,
            })),
          },
        };
      } else {
        const [
          normalizeCorrectItems,
          normalizeIncorrectItems,
          normalizeNotExistItems,
          normalizeLostItems,
        ] = [correctItems, incorrectItems, notExistItems, lostItems].map(
          (arrays: Array<{ itemId: string; itemQuantity: number }>) => {
            return arrays.map(
              ({
                itemId,
                itemQuantity,
              }: {
                itemId: string;
                itemQuantity: number;
              }) => ({
                order_id: order_id as string,
                item_id: itemId,
                station: worker_station as StationName,
                worker_id: worker_id as string,
                quantity_input: itemQuantity,
                status: "pending" as MismatchStatus,
              }),
            );
          },
        );

        const [correct, incorrect, notExist, lost] = await prisma.$transaction([
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeCorrectItems.map((item) => ({
              ...item,
              admin_note: "match",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeIncorrectItems.map((item) => ({
              ...item,
              admin_note: "mismatch",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeNotExistItems.map((item) => ({
              ...item,
              admin_note: "new",
            })),
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeLostItems.map((item) => ({
              ...item,
              admin_note: "lost",
            })),
          }),
        ]);

        return {
          success: false,
          message: "Item re-input failed waiting for admin approval",
          data: {
            match: correct.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            mismatch: incorrect.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            new: notExist.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
            lost: lost.map((i) => ({
              itemId: i.item_id,
              quantity: i.quantity_input,
            })),
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async markDone(data: MarkDoneServiceMethodDTO) {
    try {
      const { orderId, userId: workerId, outletId } = data;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          packing_worker_id: workerId,
          outlet_id: outletId,
        },
        select: {
          status: true,
          source: true,
          paid: true,
        },
      });

      if (!order) {
        throw new HttpError(400, "This job is not assigned to you");
      }
      if (order.status !== "packing_in_progress") {
        throw new HttpError(400, "You've already completed this job");
      }

      const pending = await prisma.orderStationLog.findMany({
        where: {
          order_id: orderId,
          worker_id: workerId,
          station: "packing" as StationName,
          status: "pending" as MismatchStatus,
        },
      });

      if (pending.length > 0) {
        throw new HttpError(
          400,
          "Failed to mark completed, there are pending item re-input waiting for admin approval",
        );
      }

      const complete = await prisma.order.update({
        where: {
          id: orderId,
          outlet_id: outletId,
          packing_worker_id: workerId,
        },
        data: {
          packing_completed_at: new Date(),
          status:
            order.source === "walk_in"
              ? "delivered"
              : order.paid
                ? "waiting_for_driver_deliver"
                : "waiting_for_payment",
          // so the walkin customer can be marked as finished when picked up (query with delivered status)
        },
        select: {
          id: true,
          status: true,
          source: true,
          customer: { select: { name: true } },
          walkInCustomer: { select: { name: true } },
        },
      });

      const { customer, walkInCustomer, ...rest } = complete;
      const customerName = customer?.name ?? walkInCustomer?.name;
      if (!customerName) {
        throw new HttpError(400, "Customer name not found");
      }

      const normalized = {
        ...rest,
        customer_name: customerName,
      };

      return {
        success: true,
        message: "Packing job completed",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }

  async getCompleteJobs(data: GetCompleteJobsMethodDTO) {
    try {
      const { outletId, workerId } = data;

      const completeJobs = await prisma.order.findMany({
        where: {
          packing_worker_id: workerId,
          outlet_id: outletId,
          status: {
            not: "packing_in_progress",
          },
          packing_completed_at: {
            not: null,
          },
        },
        select: {
          id: true,
          customer: {
            select: {
              name: true,
            },
          },
          walkInCustomer: {
            select: {
              name: true,
            },
          },
          packing_completed_at: true,
        },
        orderBy: {
          packing_completed_at: "desc",
        },
      });

      const normalized = completeJobs.map((job) => {
        const customerName =
          job.customer?.name ?? job.walkInCustomer?.name ?? "";
        return {
          id: job.id,
          customerName,
          completedAt: job.packing_completed_at,
        };
      });

      return {
        success: true,
        message: "Get complete jobs successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }
}
