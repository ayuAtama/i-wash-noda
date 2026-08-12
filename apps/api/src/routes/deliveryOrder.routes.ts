import { Router } from "express";
import { DeliveryOrderController } from "@/controllers/deliveryOrder.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { DeliveryOrderValidation } from "@/validations/deliveryOder.validation";
import { ResolveContext } from "@/middleware/resolveContext";
import { DeliveryOrderService } from "@/services/deliverOrder.services";

export class DeliveryOrderRoute {
  public router = Router();
  private controller: DeliveryOrderController;

  constructor(controller: DeliveryOrderController) {
    this.controller = controller;
    this.activeJobs();
    this.checkAvailableJobs();
    this.takeTheJob();
    this.updateStatus();
    this.completeJobs();
  }

  private checkAvailableJobs() {
    this.router.get(
      "/available",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      this.controller.available,
    );
  }

  private takeTheJob() {
    this.router.post(
      "/:deliveryId/accept",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      Validator.validate({
        params: DeliveryOrderValidation.DeliveryIdParamsSchema,
      }),
      ResolveContext.handler,
      this.controller.accept,
    );
  }

  private updateStatus() {
    this.router.patch(
      "/:deliveryId/next",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      Validator.validate({
        params: DeliveryOrderValidation.DeliveryIdParamsSchema,
      }),
      ResolveContext.handler,
      this.controller.updateStatus,
    );
  }

  private activeJobs() {
    this.router.get(
      "/active",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      this.controller.activeJobs,
    );
  }

  private completeJobs() {
    this.router.get(
      "/complete",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("driver"),
      ResolveContext.handler,
      this.controller.completedJobs,
    );
  }
}
export default new DeliveryOrderRoute(
  new DeliveryOrderController(new DeliveryOrderService()),
).router;
