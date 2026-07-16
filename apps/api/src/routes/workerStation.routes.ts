// /api/src/routes/workerStation.routes.ts

import { Router } from "express";
import { WorkerStationController } from "@/controllers/workerStation.controller";
import { WorkerStationService } from "@/services/workerStation.services";
import { authorizationMiddleware } from "@/middleware/authorization";
import { authenticationMiddleware } from "@/middleware/authentication";
import { resolveContext } from "@/middleware/resolveContext";

export class WorkerStationRoute {
  public router = Router();
  private controller: WorkerStationController;
  constructor() {
    this.controller = new WorkerStationController(new WorkerStationService());
    this.checkAvailableJobs();
    this.checkActiveJobs();
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
}

export default new WorkerStationRoute().router;
