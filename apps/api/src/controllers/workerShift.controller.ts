// apps/api/src/services/workerShift.services.ts
import { WorkerShiftService } from "@/services/workerShift.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreateSchedulePayloadDTO,
  CreateWorkerShiftInputDTO,
  FetchUnScheduledWorkerDTO,
  UnScheduleWorkerPayloadDTO,
  WorkerShiftIdParamsDTO,
  UpdateWorkerShiftInputDTO,
  FetchWorkerScheduleDTO,
  FetchWorkerSchedulePayloadDTO,
} from "@/validations/workerShift.validation";
import { PaginationDTO } from "@/validations/pagination.validation";

export class WorkerShiftController {
  private workerShiftService: WorkerShiftService;

  constructor(workerShiftService: WorkerShiftService) {
    this.workerShiftService = workerShiftService;
  }

  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. validate request body
      // const parsed = CreateWorkerShiftSchema.safeParse(req.body);
      // if (!parsed.success) {
      //   return res.status(400).json({
      //     message: "Validation error",
      //     errors: parsed.error.issues,
      //   });
      // }

      // get the outlet id
      if (!req.context) throw new HttpError(500, "This is an invalid user");
      const outletId = req.context.outlet_id;

      // 2. call service after used middleware (DTO validation)
      const body = req.validated!.body as CreateWorkerShiftInputDTO;
      const payload = {
        ...body,
        outlet_id: outletId,
      } as CreateSchedulePayloadDTO;
      const test = await this.workerShiftService.replaceWeeklySchedule(payload);

      // 3. response
      return res.status(200).json({
        success: true,
        message: "Worker weekly schedule saved",
        data: test,
      });
    } catch (error) {
      next(error);
    }
  };

  getScheduleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      //const id = String(req.params.id);
      const { id } = req.validated!.params as WorkerShiftIdParamsDTO;
      const schedule = await this.workerShiftService.getShiftsByWorkerId(id);
      if (!schedule) {
        throw new HttpError(404, "Schedule not found");
      }
      // const formatted = schedule.map((item) => ({
      //   ...item,
      //   start_time: format(item.start_time, "HH:mm"),
      //   end_time: format(item.end_time, "HH:mm"),
      // }));
      return res.status(200).json({
        success: true,
        message: "Schedule fetched successfully",
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchUnScheduledWorker = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const outletId = req.context!.outlet_id;
      const query = req.validated!.query as FetchUnScheduledWorkerDTO;
      const { page, limit } = req.validated!.query as PaginationDTO;

      const payload = {
        ...query,
        outlet_id: outletId,
      } as UnScheduleWorkerPayloadDTO;

      const result = await this.workerShiftService.fetchUnScheduledWorker(
        payload,
        page,
        limit,
      );

      return res.status(200).json({
        success: true,
        message: "Unscheduled workers fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.context!.outlet_id;
      const { id } = req.validated!.params as WorkerShiftIdParamsDTO;
      const body = req.validated!.body as UpdateWorkerShiftInputDTO;

      const payload = {
        workerId: id,
        schedules: body.schedules,
        outlet_id: outletId,
      } as CreateSchedulePayloadDTO;

      const updated =
        await this.workerShiftService.replaceWeeklySchedule(payload);

      return res.status(200).json({
        success: true,
        message: "Worker schedule updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchAllSchedules = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const outletId = req.context!.outlet_id;
      const query = req.validated!.query as FetchWorkerScheduleDTO;
      const payload: FetchWorkerSchedulePayloadDTO = {
        ...query,
        outlet_id: outletId,
      };

      const result = await this.workerShiftService.fetchAllSchedules(payload);

      return res.status(200).json({
        success: true,
        message: "Worker schedules fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchWorkers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.context!.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.workerShiftService.fetchWorkersByOutlet(
        outletId,
        undefined,
        undefined,
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        message: "Workers fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchWashingWorkers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const outletId = req.context!.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.workerShiftService.fetchWorkersByOutlet(
        outletId,
        "worker",
        "washing",
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        message: "Washing workers fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchIroningWorkers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const outletId = req.context!.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.workerShiftService.fetchWorkersByOutlet(
        outletId,
        "worker",
        "ironing",
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        message: "Ironing workers fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchPackingWorkers = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const outletId = req.context!.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.workerShiftService.fetchWorkersByOutlet(
        outletId,
        "worker",
        "packing",
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        message: "Packing workers fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.context!.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.workerShiftService.fetchWorkersByOutlet(
        outletId,
        "driver",
        undefined,
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        message: "Drivers fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
