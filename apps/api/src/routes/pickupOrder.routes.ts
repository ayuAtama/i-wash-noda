// apps/api/src/routes/pickupOrder.routes.ts
import { Router } from "express";
import { PickupOrderController } from "@/controllers/pickupOrder.controller";
import { PickupOrderService } from "@/services/pickupOrder.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { ResolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { PickupOrderValidation } from "@/validations/pickupOrder.validation";
import { PaginationSchema } from "@/validations/pagination.validation";

export class PickupOrderRoute {
  public router = Router();
  private controller: PickupOrderController;

  constructor(controller: PickupOrderController) {
    this.controller = controller;
    this.getAllPickupOrders();
    this.acceptPickupRequest();
    this.listJobs();
    this.updateStatus();
    this.getAllAlreadyPickedUpJob();
  }

  private getAllPickupOrders() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllPickupRequests,
    );
  }

  private acceptPickupRequest() {
    this.router.post(
      "/:id/accept",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({
        params: PickupOrderValidation.PickupIdParamsSchema,
      }),
      this.controller.acceptPickupRequest,
    );
  }

  private listJobs() {
    this.router.get(
      "/accepted",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAcceptedPickupRequests,
    );
  }

  private updateStatus() {
    this.router.patch(
      "/:id/next",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({
        // body: PickupOrderValidation.UpdateStatusSchema,
        params: PickupOrderValidation.PickupIdParamsSchema,
      }),
      this.controller.updateStatus,
    );
  }

  private getAllAlreadyPickedUpJob() {
    this.router.get(
      "/already-picked-up",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllAlreadyPickedUpJob,
    );
  }
}

export default new PickupOrderRoute(
  new PickupOrderController(new PickupOrderService()),
).router;
