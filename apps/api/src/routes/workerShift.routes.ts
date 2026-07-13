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
  FetchUnScheduledWorkerSchema,
  FilterQueryScheduleSchema,
} from "@/validations/workerShift.validation";
import { resolveContext } from "@/middleware/resolveContext";
import ensureWorkerOnShift from "@/middleware/ensureWorkerOnShift";

export class WorkerShiftRoute {
  public router = Router();
  private controller: WorkerShiftController;

  constructor() {
    this.controller = new WorkerShiftController(new WorkerShiftService());
    this.getSchedule();
    this.scheduleSummaryDashboard();
    this.fetchUnScheduledWorker();
    this.createSchedule();
    this.getScheduleById();
  }

  private getSchedule() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({
        query: FilterQueryScheduleSchema,
      }),
      this.controller.getSchedule,
    );
  }

  private createSchedule() {
    this.router.post(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({
        params: WorkerShiftIdParamsSechema,
        body: CreateWorkerShiftSchema,
      }),
      this.controller.createSchedule,
    );
  }

  private getScheduleById() {
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

  private fetchUnScheduledWorker() {
    this.router.get(
      "/no-shift-workers",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({
        query: FetchUnScheduledWorkerSchema,
      }),
      this.controller.fetchUnScheduledWorker,
    );
  }

  private scheduleSummaryDashboard() {
    this.router.get(
      "/summary-dashboard",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      this.controller.scheduleSummaryDashboard,
    );
  }
}

export default new WorkerShiftRoute().router;
