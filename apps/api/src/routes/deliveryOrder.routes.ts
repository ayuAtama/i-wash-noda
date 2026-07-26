import { Router } from "express";
import { DeliveryOrderController } from "@/controllers/deliveryOrder.controller";
import { DeliveryOrderService } from "@/services/deliverOrder.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { DeliveryOrderValidation } from "@/validations/deliveryOder.validation";
import { resolveContext } from "@/middleware/resolveContext";

export class DeliveryOrderRoute {
  public router = Router();
  private controller: DeliveryOrderController;

  constructor() {
    this.controller = new DeliveryOrderController(new DeliveryOrderService());
    this.activeJobs();
    this.checkAvailableJobs();
    this.takeTheJob();
    this.updateStatus();
    this.completeJobs();
  }

  private checkAvailableJobs() {
    this.router.get(
      "/available",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.available,
    );
  }

  private takeTheJob() {
    this.router.post(
      "/:deliveryId/accept",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      Validator.validate({
        params: DeliveryOrderValidation.DeliveryIdParamsSchema,
      }),
      resolveContext,
      this.controller.accept,
    );
  }

  private updateStatus() {
    this.router.patch(
      "/:deliveryId/next",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      Validator.validate({
        params: DeliveryOrderValidation.DeliveryIdParamsSchema,
      }),
      resolveContext,
      this.controller.updateStatus,
    );
  }

  private activeJobs() {
    this.router.get(
      "/active",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.activeJobs,
    );
  }

  private completeJobs() {
    this.router.get(
      "/complete",
      authenticationMiddleware,
      authorizationMiddleware("driver"),
      resolveContext,
      this.controller.completedJobs,
    );
  }
}
export default new DeliveryOrderRoute().router;
