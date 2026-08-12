// apps/api/src/routes/workerShift.services.ts
import { Router } from "express";
import { WorkerShiftController } from "@/controllers/workerShift.controller";
import { WorkerShiftService } from "@/services/workerShift.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { WorkerShiftValidation } from "@/validations/workerShift.validation";
import { ResolveContext } from "@/middleware/resolveContext";
import { EnsureWorkerOnShift } from "@/middleware/ensureWorkerOnShift";

export class WorkerShiftRoute {
  public router = Router();
  private controller: WorkerShiftController;

  constructor(controller: WorkerShiftController) {
    this.controller = controller;
    this.getSchedule();
    this.scheduleSummaryDashboard();
    this.fetchUnScheduledWorker();
    this.createSchedule();
    this.getScheduleById();
  }

  private getSchedule() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        query: WorkerShiftValidation.FilterQueryScheduleSchema,
      }),
      this.controller.getSchedule,
    );
  }

  private createSchedule() {
    this.router.post(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        params: WorkerShiftValidation.WorkerShiftIdParamsSchema,
        body: WorkerShiftValidation.CreateWorkerShiftSchema,
      }),
      this.controller.createSchedule,
    );
  }

  private getScheduleById() {
    this.router.get(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      EnsureWorkerOnShift.handler,
      Validator.validate({
        params: WorkerShiftValidation.WorkerShiftIdParamsSchema,
      }),
      this.controller.getScheduleById,
    );
  }

  private fetchUnScheduledWorker() {
    this.router.get(
      "/no-shift-workers",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        query: WorkerShiftValidation.FetchUnScheduledWorkerSchema,
      }),
      this.controller.fetchUnScheduledWorker,
    );
  }

  private scheduleSummaryDashboard() {
    this.router.get(
      "/summary-dashboard",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin", "super_admin"),
      ResolveContext.handler,
      this.controller.scheduleSummaryDashboard,
    );
  }
}

export default new WorkerShiftRoute(
  new WorkerShiftController(new WorkerShiftService()),
).router;
