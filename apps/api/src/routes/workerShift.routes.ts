// apps/api/src/routes/workerShift.routes.ts
import { Router } from "express";
import { z } from "zod";

const WorkerPaginationSchema = z.object({
  page: PaginationSchema.shape.page,
  limit: PaginationSchema.shape.limit,
});

const UnScheduledWorkerPaginationSchema = FetchUnScheduledWorkerSchema.extend({
  page: PaginationSchema.shape.page,
  limit: PaginationSchema.shape.limit,
});

import { WorkerShiftController } from "@/controllers/workerShift.controller";
import { WorkerShiftService } from "@/services/workerShift.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import {
  CreateWorkerShiftSchema,
  UpdateWorkerShiftSchema,
  WorkerShiftIdParamsSechema,
  FetchUnScheduledWorkerSchema,
  FetchWorkerScheduleSchema,
} from "@/validations/workerShift.validation";
import { PaginationSchema } from "@/validations/pagination.validation";
import { resolveContext } from "@/middleware/resolveContext";
import ensureWorkerOnShift from "@/middleware/ensureWorkerOnShift";

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

  private updateSchedule() {
    this.router.put(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({
        params: WorkerShiftIdParamsSechema,
        body: UpdateWorkerShiftSchema,
      }),
      this.controller.updateSchedule,
    );
  }

  private fetchAllSchedules() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({
        query: FetchWorkerScheduleSchema,
      }),
      this.controller.fetchAllSchedules,
    );
  }

  private fetchWorkers() {
    this.router.get(
      "/workers",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchWorkers,
    );
  }

  private fetchWashingWorkers() {
    this.router.get(
      "/washing",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchWashingWorkers,
    );
  }

  private fetchIroningWorkers() {
    this.router.get(
      "/ironing",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchIroningWorkers,
    );
  }

  private fetchPackingWorkers() {
    this.router.get(
      "/packing",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchPackingWorkers,
    );
  }

  private fetchDrivers() {
    this.router.get(
      "/driver",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      resolveContext,
      Validator.validate({ query: WorkerPaginationSchema }),
      this.controller.fetchDrivers,
    );
  }

  private getScheduleById() {
    this.router.get(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
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
        query: UnScheduledWorkerPaginationSchema,
      }),
      this.controller.fetchUnScheduledWorker,
    );
  }

  private scheduleSummaryDashboard() {
    this.router.get(
      "/summary-dashboard",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin", "super_admin"),
      resolveContext,
      this.controller.scheduleSummaryDashboard,
    );
  }
}

export default new WorkerShiftRoute(
  new WorkerShiftController(new WorkerShiftService()),
).router;
