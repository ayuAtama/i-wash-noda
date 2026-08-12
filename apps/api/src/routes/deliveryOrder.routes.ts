// src/routes/deliveryOrder.routes.ts
import { Router } from "express";
import { DeliveryOrderController } from "@/controllers/deliveryOrder.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { ResolveContext } from "@/middleware/resolveContext";
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllDeliveryRequests,
    );
  }

  private acceptDeliveryRequest() {
    this.router.post(
      "/:id/accept",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({
        params: DeliveryValidation.DeliveryIdParamsSchema,
      }),
      this.controller.acceptDeliveryRequest,
    );
  }

  private updateDeliveryStatus() {
    this.router.patch(
      "/:id/next",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({
        params: DeliveryValidation.DeliveryIdParamsSchema,
      }),
      this.controller.updateDeliveryStatus,
    );
  }

  private getAcceptedDeliveries() {
    this.router.get(
      "/accepted",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAcceptedDeliveries,
    );
  }

  private getCompletedDeliveries() {
    this.router.get(
      "/completed",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getCompletedDeliveries,
    );
  }
}

export default new DeliveryOrderRoute().router;
