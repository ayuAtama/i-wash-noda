// apps/api/src/services/workerShift.services.ts
import { WorkerShiftService } from "@/services/workerShift.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreateSchedulePayloadDTO,
  CreateWorkerShiftInputDTO,
  FetchUnScheduledWorkerDTO,
  FilterQueryScheduleDTO,
  UnScheduleWorkerPayloadDTO,
  WorkerShiftIdParamsDTO,
} from "@/validations/workerShift.validation";

export class WorkerShiftController {
  private workerShiftService: WorkerShiftService;

  constructor(workerShiftService: WorkerShiftService) {
    this.workerShiftService = workerShiftService;
  }

  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the outlet id
      if (!req.context) throw new HttpError(500, "This is an invalid user");
      const outletId = req.context.outlet_id;

      //  call service after used middleware (DTO validation)
      const body = req.validated!.body as CreateWorkerShiftInputDTO;

      const params = req.validated!.params as WorkerShiftIdParamsDTO;

      const payload = {
        ...params,
        ...body,
        outlet_id: outletId,
      } as CreateSchedulePayloadDTO;

      // 2. call service
      const result =
        await this.workerShiftService.replaceWeeklySchedule(payload);

      // 3. response
      return res.status(200).json({
        success: true,
        message: "Worker weekly schedule saved",
        data: result,
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
      // get the outlet id from the outlet admin (req.context)
      const outletId = req.context!.outlet_id;

      // destructure the query from req.validated
      const query = req.validated!.query as FetchUnScheduledWorkerDTO;

      // make the payload
      const payload = {
        ...query,
        outlet_id: outletId,
      } as UnScheduleWorkerPayloadDTO;

      // call the service
      const workers =
        await this.workerShiftService.fetchUnScheduledWorker(payload);

      return res.status(200).json({
        success: true,
        message: "Unscheduled workers fetched successfully",
        data: workers,
      });
    } catch (error) {
      next(error);
    }
  };

  scheduleSummaryDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { outlet_id } = req.context!;
      const result = await this.workerShiftService.scheduleSummaryDashboard({
        outlet_id,
      });
      return res.status(200).json({
        success: true,
        message: "Dashboard fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { outlet_id } = req.context!;
      const query = req.validated!.query as FilterQueryScheduleDTO;
      const result = await this.workerShiftService.getSchedule({
        ...query,
        outlet_id,
      });
      return res.status(200).json({
        success: true,
        message: "Schedule fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
