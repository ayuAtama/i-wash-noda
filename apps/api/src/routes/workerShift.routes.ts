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
import { resolveContext } from "@/middleware/resolveContext";
import ensureWorkerOnShift from "@/middleware/ensureWorkerOnShift";

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
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({
        body: CreateWorkerShiftSchema,
      }),
      this.controller.createSchedule,
    );
  }

  private getSchedule() {
    this.router.get(
      "/:id",
      authenticationMiddleware,
      resolveContext,
      ensureWorkerOnShift,
      Validator.validate({
        params: WorkerShiftIdParamsSechema,
      }),
      this.controller.getScheduleById,
    );
  }
}

export default new WorkerShiftRoute().router;
