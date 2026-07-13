// apps/api/src/routes/routes.ts
import { Router } from "express";
import { PickupRequestController } from "@/controllers/pickupRequest.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { PickupRequestValidation } from "@/validations/pickupRequest.validation";
import { PickupRequestService } from "@/services/pickupRequest.services";

export class PickupRequestRoute {
  public router = Router();
  private controller: PickupRequestController;

  constructor() {
    this.controller = new PickupRequestController(new PickupRequestService());
    this.checkAddressFirst();
    this.createPickupRequest();
    this.cancelPickupRequest();
    this.checkOrderStatus();
  }

  // check if the user has address
  private checkAddressFirst() {
    this.router.get(
      "/coverage-check",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.checkAddressFirst,
    );
  }

  private createPickupRequest() {
    this.router.post(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        body: PickupRequestValidation.CreatePickupRequestSchema,
      }),
      this.controller.createPickupRequest,
    );
  }

  private cancelPickupRequest() {
    this.router.delete(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        params: PickupRequestValidation.PickupRequestIdParamsSchema,
      }),
      this.controller.cancelPickupRequest,
    );
  }

  private checkOrderStatus() {
    this.router.get(
      "/status",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.checkOrderStatus,
    );
  }
}

export default new PickupRequestRoute().router;
