// src/routes/deliveryOrder.routes.ts
import { Router } from "express";
import { DeliveryOrderController } from "@/controllers/deliveryOrder.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { DeliveryValidation } from "@/validations/delivery.validation";
import { DeliveryOrderService } from "@/services/deliveryOrder.services";
import { PaginationSchema } from "@/validations/pagination.validation";

export class DeliveryOrderRoute {
  public router = Router();
  private controller: DeliveryOrderController;

  constructor() {
    this.controller = new DeliveryOrderController(new DeliveryOrderService());
    this.getAllDeliveryRequests();
    this.acceptDeliveryRequest();
    this.updateDeliveryStatus();
    this.getAcceptedDeliveries();
    this.getCompletedDeliveries();
  }

  private getAllDeliveryRequests() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllDeliveryRequests,
    );
  }

  private acceptDeliveryRequest() {
    this.router.post(
      "/:id/accept",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({
        params: DeliveryValidation.DeliveryIdParamsSchema,
      }),
      this.controller.acceptDeliveryRequest,
    );
  }

  private updateDeliveryStatus() {
    this.router.patch(
      "/:id/next",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({
        params: DeliveryValidation.DeliveryIdParamsSchema,
      }),
      this.controller.updateDeliveryStatus,
    );
  }

  private getAcceptedDeliveries() {
    this.router.get(
      "/accepted",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAcceptedDeliveries,
    );
  }

  private getCompletedDeliveries() {
    this.router.get(
      "/completed",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getCompletedDeliveries,
    );
  }
}

export default new DeliveryOrderRoute().router;
