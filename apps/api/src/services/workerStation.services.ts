// /api/src/services/workerStation.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { WorkerStation } from "@/generated/prisma/client";
import WorkerStationStrategy from "@/types/workerStationStrategy";

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
}
