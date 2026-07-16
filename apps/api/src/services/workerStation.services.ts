// /api/src/services/workerStation.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { WorkerStation } from "@/generated/prisma/client";
import WorkerStationStrategy from "@/types/workerStationStrategy";
import {
  ReInputServiceMethodPayloadDTO,
  ReInputServiceStrategyPayloadDTO,
} from "@/validations/workerStation.validation";

export class WorkerStationService {
  private strategies: Record<WorkerStation, WorkerStationStrategy> = {
    washing: new WashingService(),
    ironing: new IroningService(),
    packing: new PackingService(),
  };

  async checkAvailableJobs(data: {
    outlet_id: string;
    worker_station: string;
  }) {
    try {
      // get the worker station
      const { worker_station, outlet_id } = data;

      // register the worker_station into strategies
      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      // call the service
      const availableJobs = await strategy.checkAvailableJobs(outlet_id);

      // return the available jobs
      return availableJobs;
    } catch (error) {
      throw error;
    }
  }

  async checkActiveJobs(data: {
    outlet_id: string;
    worker_station: string;
    worker_id: string;
  }) {
    try {
      // get the worker station
      const { worker_station, outlet_id, worker_id } = data;

      // register the worker_station into strategies
      const strategy = this.strategies[worker_station as WorkerStation];
      if (!strategy) {
        throw new HttpError(400, "Invalid worker station");
      }

      // call the service
      const activeJobs = await strategy.checkActiveJobs({
        outletId: outlet_id,
        workerId: worker_id,
      });

      // return the available jobs
      return activeJobs;
    } catch (error) {
      throw error;
    }
  }

  async reInputItem(data: ReInputServiceStrategyPayloadDTO) {
    try {
      // destructure the data
      const {
        workerStation: worker_station,
        ...rest
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

      // call the service
      const reInputItem = await strategy.reInputItem(rest);

      // return to the controller
      return reInputItem;
    } catch (err) {
      throw err;
    }
  }
}

class WashingService implements WorkerStationStrategy {
  async checkAvailableJobs(outletId: string) {
    try {
      // get the available jobs
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

  async checkActiveJobs(data: { outletId: string; workerId: string }) {
    try {
      // destructure the data
      const { outletId, workerId } = data;

      // get the accecpted jobs by the station
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

      // return the active jobs
      return {
        success: true,
        message: "Active jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  async reInputItem(data: ReInputServiceMethodPayloadDTO) {
    try {
      // destructure the data (order_id from params, items from body)
      const { orderId: order_id, userId: worker_id, items } = data;

      // get the actual item
      const actualItem = await prisma.orderItem.findMany({
        where: {
          order_id,
        },
        select: {
          item_id: true,
          quantity_initial: true,
        },
      });

      // compare the inputted item with the actual item
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

      // auto send the items to station Log if the item same
      if (correctItems.length === actualItem.length) {
        // make the payload
        const dataStationSummary = correctItems.map((item) => {
          return {
            order_id: order_id,
            item_id: item.itemId,
            latest_quantity: item.itemQuantity,
            station: "washing" as const,
          };
        });

        const dataStationLog = dataStationSummary.map((item) => {
          return {
            order_id: item.order_id,
            item_id: item.item_id,
            station: item.station,
            worker_id: worker_id,
            quantity_input: item.latest_quantity,
            status: "approved" as const,
            admin_note: "Auto Accepted because the item match!",
          };
        });

        // create the stationLog and station summary
        const result = await prisma.$transaction(async (tx) => {
          // station log
          const stationLog = await tx.orderStationLog.createManyAndReturn({
            data: dataStationLog,
          });

          // station summary
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
            stationLog: result.stationLog,
            stationSummary: result.stationSummary,
          },
        };
      } else {
        // if (incorrectItems.length > 0 || notExistItems.length > 0) {
        // log the data of the correct, incorrect, and not exist items as pending

        // normalize the data
        const [
          normalizeCorrectItems,
          normalizeIncorrectItems,
          normalizeNotExistItems,
        ] = [correctItems, incorrectItems, notExistItems].map(
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
                station: "washing" as const,
                worker_id: worker_id as string,
                quantity_input: itemQuantity,
                status: "pending" as const,
              }),
            );
          },
        );

        // log to database
        const result = await prisma.$transaction([
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeCorrectItems,
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeIncorrectItems,
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeNotExistItems,
          }),
        ]);

        // return the data
        return {
          success: false,
          message: "Item re-input failed waiting for admin approval",
          data: result,
        };
        // }
      }
    } catch (error) {
      throw error;
    }
  }
}

class IroningService implements WorkerStationStrategy {
  async checkAvailableJobs(outletId: string) {
    try {
      // get the available jobs
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

  async checkActiveJobs(data: { outletId: string; workerId: string }) {
    try {
      // destructure the data
      const { outletId, workerId } = data;

      // get the accecpted jobs by the station
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

      // return the active jobs
      return {
        success: true,
        message: "Active jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  // place holder
  async reInputItem(data: ReInputServiceMethodPayloadDTO) {
    try {
      // destructure the data (order_id from params, items from body)
      const { orderId: order_id, userId: worker_id, items } = data;

      // get the actual item
      const actualItem = await prisma.orderItem.findMany({
        where: {
          order_id,
        },
        select: {
          item_id: true,
          quantity_initial: true,
        },
      });

      // compare the inputted item with the actual item
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

      // auto send the items to station Log if the item same
      if (correctItems.length === actualItem.length) {
        // make the payload
        const dataStationSummary = correctItems.map((item) => {
          return {
            order_id: order_id,
            item_id: item.itemId,
            latest_quantity: item.itemQuantity,
            station: "washing" as const,
          };
        });

        const dataStationLog = dataStationSummary.map((item) => {
          return {
            order_id: item.order_id,
            item_id: item.item_id,
            station: item.station,
            worker_id: worker_id,
            quantity_input: item.latest_quantity,
            status: "approved" as const,
            admin_note: "Auto Accepted because the item match!",
          };
        });

        // create the stationLog and station summary
        const result = await prisma.$transaction(async (tx) => {
          // station log
          const stationLog = await tx.orderStationLog.createManyAndReturn({
            data: dataStationLog,
          });

          // station summary
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
            stationLog: result.stationLog,
            stationSummary: result.stationSummary,
          },
        };
      } else {
        // if (incorrectItems.length > 0 || notExistItems.length > 0) {
        // log the data of the correct, incorrect, and not exist items as pending

        // normalize the data
        const [
          normalizeCorrectItems,
          normalizeIncorrectItems,
          normalizeNotExistItems,
        ] = [correctItems, incorrectItems, notExistItems].map(
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
                station: "washing" as const,
                worker_id: worker_id as string,
                quantity_input: itemQuantity,
                status: "pending" as const,
              }),
            );
          },
        );

        // log to database
        const result = await prisma.$transaction([
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeCorrectItems,
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeIncorrectItems,
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeNotExistItems,
          }),
        ]);

        // return the data
        return {
          success: false,
          message: "Item re-input failed waiting for admin approval",
          data: result,
        };
        // }
      }
    } catch (error) {
      throw error;
    }
  }
}

class PackingService implements WorkerStationStrategy {
  async checkAvailableJobs(outletId: string) {
    try {
      // get the available jobs
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

  async checkActiveJobs(data: { outletId: string; workerId: string }) {
    try {
      // destructure the data
      const { outletId, workerId } = data;

      // get the accecpted jobs by the station
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

      // return the active jobs
      return {
        success: true,
        message: "Active jobs fetched successfully",
        data: normalize,
      };
    } catch (error) {
      throw error;
    }
  }

  // place holder
  async reInputItem(data: ReInputServiceMethodPayloadDTO) {
    try {
      // destructure the data (order_id from params, items from body)
      const { orderId: order_id, userId: worker_id, items } = data;

      // get the actual item
      const actualItem = await prisma.orderItem.findMany({
        where: {
          order_id,
        },
        select: {
          item_id: true,
          quantity_initial: true,
        },
      });

      // compare the inputted item with the actual item
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

      // auto send the items to station Log if the item same
      if (correctItems.length === actualItem.length) {
        // make the payload
        const dataStationSummary = correctItems.map((item) => {
          return {
            order_id: order_id,
            item_id: item.itemId,
            latest_quantity: item.itemQuantity,
            station: "washing" as const,
          };
        });

        const dataStationLog = dataStationSummary.map((item) => {
          return {
            order_id: item.order_id,
            item_id: item.item_id,
            station: item.station,
            worker_id: worker_id,
            quantity_input: item.latest_quantity,
            status: "approved" as const,
            admin_note: "Auto Accepted because the item match!",
          };
        });

        // create the stationLog and station summary
        const result = await prisma.$transaction(async (tx) => {
          // station log
          const stationLog = await tx.orderStationLog.createManyAndReturn({
            data: dataStationLog,
          });

          // station summary
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
            stationLog: result.stationLog,
            stationSummary: result.stationSummary,
          },
        };
      } else {
        // if (incorrectItems.length > 0 || notExistItems.length > 0) {
        // log the data of the correct, incorrect, and not exist items as pending

        // normalize the data
        const [
          normalizeCorrectItems,
          normalizeIncorrectItems,
          normalizeNotExistItems,
        ] = [correctItems, incorrectItems, notExistItems].map(
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
                station: "washing" as const,
                worker_id: worker_id as string,
                quantity_input: itemQuantity,
                status: "pending" as const,
              }),
            );
          },
        );

        // log to database
        const result = await prisma.$transaction([
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeCorrectItems,
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeIncorrectItems,
          }),
          prisma.orderStationLog.createManyAndReturn({
            data: normalizeNotExistItems,
          }),
        ]);

        // return the data
        return {
          success: false,
          message: "Item re-input failed waiting for admin approval",
          data: result,
        };
        // }
      }
    } catch (error) {
      throw error;
    }
  }
}
