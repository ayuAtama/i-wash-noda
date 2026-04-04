// apps/api/src/routes/pickupOrder.routes.ts
import { Router } from "express";
import { PickupOrderController } from "@/controllers/pickupOrder.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { PickupOrderValidation } from "@/validations/pickupOrder.validation";
import { PickupOrderService } from "@/services/pickupOrder.services";

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
      "/pickup-requests",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.getAllPickupRequests,
    );
  }

  private acceptPickupRequest() {
    this.router.post(
      "/pickup-requests/:id/accept",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({
        params: PickupOrderValidation.PickupIdParamsSchema,
      }),
      this.controller.acceptPickupRequest,
    );
  }

  private listJobs() {
    this.router.get(
      "/pickup-requests/accepted",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.getAcceptedPickupRequests,
    );
  }

  private updateStatus() {
    this.router.patch(
      "/pickup-requests/:id/status",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({
        body: PickupOrderValidation.UpdateStatusSchema,
        params: PickupOrderValidation.PickupIdParamsSchema,
      }),
      this.controller.updateStatus,
    );
  }
}

export default new PickupOrderRoute().router;
