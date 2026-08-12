// apps/api/src/routes/workerShift.routes.ts
import { Router } from "express";
import { z } from "zod";

import { WorkerShiftController } from "@/controllers/workerShift.controller";
import { WorkerShiftService } from "@/services/workerShift.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { WorkerShiftValidation } from "@/validations/workerShift.validation";
import { ResolveContext } from "@/middleware/resolveContext";
import { EnsureWorkerOnShift } from "@/middleware/ensureWorkerOnShift";
import { PaginationSchema } from "@/validations/pagination.validation";

const WorkerPaginationSchema = z.object({
  page: PaginationSchema.shape.page,
  limit: PaginationSchema.shape.limit,
});

const UnScheduledWorkerPaginationSchema =
  WorkerShiftValidation.FetchUnScheduledWorkerSchema.extend({
    page: PaginationSchema.shape.page,
    limit: PaginationSchema.shape.limit,
  });

export class WorkerShiftRoute {
  public router = Router();
  private controller: WorkerShiftController;

  constructor(controller: WorkerShiftController) {
    this.controller = controller;
    this.createSchedule();
    this.updateSchedule();
    this.fetchUnScheduledWorker();
    this.fetchAllSchedules();
    this.fetchWorkers();
    this.fetchWashingWorkers();
    this.fetchIroningWorkers();
    this.fetchPackingWorkers();
    this.fetchDrivers();
    this.scheduleSummaryDashboard();
    this.getScheduleById();
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

  private updateSchedule() {
    this.router.put(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        params: WorkerShiftValidation.WorkerShiftIdParamsSchema,
        body: WorkerShiftValidation.UpdateWorkerShiftSchema,
      }),
      this.controller.updateSchedule,
    );
  }

  private fetchAllSchedules() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        query: WorkerShiftValidation.FetchWorkerScheduleSchema,
      }),
      this.controller.fetchAllSchedules,
    );
  }

  private fetchWorkers() {
    this.router.get(
      "/workers",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchWorkers,
    );
  }

  private fetchWashingWorkers() {
    this.router.get(
      "/washing",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchWashingWorkers,
    );
  }

  private fetchIroningWorkers() {
    this.router.get(
      "/ironing",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchIroningWorkers,
    );
  }

  private fetchPackingWorkers() {
    this.router.get(
      "/packing",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchPackingWorkers,
    );
  }

  private fetchDrivers() {
    this.router.get(
      "/driver",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      ResolveContext.handler,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchDrivers,
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
        query: UnScheduledWorkerPaginationSchema,
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
