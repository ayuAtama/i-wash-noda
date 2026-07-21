// /api/src/routes/workerStation.routes.ts

import { Router } from "express";
import { WorkerStationController } from "@/controllers/workerStation.controller";
import { WorkerStationService } from "@/services/workerStation.services";
import { authorizationMiddleware } from "@/middleware/authorization";
import { authenticationMiddleware } from "@/middleware/authentication";
import { resolveContext } from "@/middleware/resolveContext";
import { WorkerStationValidation } from "@/validations/workerStation.validation";
import { Validator } from "@/middleware/validate";

export class WorkerStationRoute {
  public router = Router();
  private controller: WorkerStationController;
  constructor() {
    this.controller = new WorkerStationController(new WorkerStationService());
    this.checkAvailableJobs();
    this.checkActiveJobs();
    this.assignJob();
    this.reinputData();
    this.markDone();
  }
  private checkAvailableJobs() {
    this.router.get(
      "/available",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      this.controller.checkAvailableJobs,
    );
  }

  private checkActiveJobs() {
    this.router.get(
      "/active",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      this.controller.checkActiveJobs,
    );
  }

  private assignJob() {
    this.router.post(
      "/accept/:orderId",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        params: WorkerStationValidation.assignJobParamsSchema,
      }),
      this.controller.assignJob,
    );
  }

  private reinputData() {
    this.router.post(
      "/reinput/:orderId",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        params: WorkerStationValidation.reInputItemParamsSchema,
        body: WorkerStationValidation.reInputItemBodySchema,
      }),
      this.controller.reinputData,
    );
  }

  private markDone() {
    this.router.post(
      "/complete/:orderId",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        params: WorkerStationValidation.markDoneParamsSchema,
      }),
      this.controller.markDone,
    );
  }
}

export default new WorkerStationRoute().router;
