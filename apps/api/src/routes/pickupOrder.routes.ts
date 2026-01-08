// apps/api/src/routes/pickupOrder.routes.ts
import { PickupOrderController } from "@/controllers/pickupOrder.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { PickupOrderService } from "@/services/pickupOrder.services";
import { Router } from "express";

export class PickupOrderRoute {
  public router = Router();
  private controller: PickupOrderController;

  constructor() {
    this.controller = new PickupOrderController(new PickupOrderService());
    this.getAllPickupOrders();
    this.acceptPickupRequest();
    this.listJobs();
    this.updateStatus();
  }

  private getAllPickupOrders() {
    this.router.get(
      "/pickup-request",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.getAllPickupRequests
    );
  }

  private acceptPickupRequest() {
    this.router.post(
      "/pickup-request/:id/accept",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.acceptPickupRequest
    );
  }

  private listJobs() {
    this.router.get(
      "/pickup-request/jobs",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.getAcceptedPickupRequests
    );
  }

  private updateStatus() {
    this.router.put(
      "/pickup-request/:id/status",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.updateStatus
    );
  }
}

export default new PickupOrderRoute().router;
