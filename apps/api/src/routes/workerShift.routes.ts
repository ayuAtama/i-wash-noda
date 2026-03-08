// apps/api/src/routes/workerShift.services.ts
import { Router } from "express";
import { z } from "zod";
import { WorkerShiftController } from "@/controllers/workerShift.controller";
import { WorkerShiftService } from "@/services/workerShift.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import {
  CreateWorkerShiftSchema,
  WorkerShiftIdParamsSechema,
} from "@/validations/workerShift.validation";

export class WorkerShiftRoute {
  public router = Router();
  private controller: WorkerShiftController;

  constructor() {
    this.controller = new WorkerShiftController(new WorkerShiftService());
    this.createSchedule();
    this.getSchedule();
  }

  private createSchedule() {
    this.router.post(
      "/schedule",
      Validator.validate({
        body: CreateWorkerShiftSchema,
      }),
      this.controller.createSchedule,
    );
  }

  private getSchedule() {
    this.router.get(
      "/schedule/:id",
      Validator.validate({
        params: WorkerShiftIdParamsSechema,
      }),
      this.controller.getScheduleById,
    );
  }
}

export default new WorkerShiftRoute().router;
