// apps/api/src/services/workerShift.services.ts
import { WorkerShiftService } from "@/services/workerShift.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreateWorkerShiftInput,
  CreateWorkerShiftSchema,
} from "@/validations/workerShift.validation";

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

      // 2. call service after used middleware (DTO validation)
      const body = req.validated!.body as CreateWorkerShiftInput;
      await this.workerShiftService.replaceWeeklySchedule(body);

      // 3. response
      return res.status(200).json({
        message: "Worker weekly schedule saved",
      });
    } catch (error) {
      next(error);
    }
  };

  getScheduleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const schedule = await this.workerShiftService.getShiftsByWorkerId(id);
      if (!schedule) {
        throw new HttpError(404, "Schedule not found");
      }
      // const formatted = schedule.map((item) => ({
      //   ...item,
      //   start_time: format(item.start_time, "HH:mm"),
      //   end_time: format(item.end_time, "HH:mm"),
      // }));
      return res.status(200).json(schedule);
    } catch (error) {
      next(error);
    }
  };
}
