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
  }

  // check if the user has address
  private checkAddressFirst() {
    this.router.get(
      "/pickup-requests/coverage-check",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.checkAddressFirst,
    );
  }

  private createPickupRequest() {
    this.router.post(
      "/pickup-requests",
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
      "/pickup-requests/:id",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.cancelPickupRequest,
    );
  }
}

export default new PickupRequestRoute().router;
