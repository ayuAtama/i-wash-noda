// apps/api/src/routes/routes.ts
import { PickupRequestController } from "@/controllers/pickupRequest.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { PickupRequestService } from "@/services/pickupRequest.services";
import { Router } from "express";
import { Validator } from "@/middleware/validate";
import { PickupRequestValidation } from "@/validations/pickupRequest.validation";

export class PickupRequestRoute {
  public router = Router();
  private controller: PickupRequestController;

  constructor() {
    this.controller = new PickupRequestController(new PickupRequestService());
    this.checkAddressFirst();
    this.createPickupRequest();
  }

  // check if the user has address
  private checkAddressFirst() {
    this.router.get(
      "/check/pickup-request",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.checkAddressFirst,
    );
  }

  private createPickupRequest() {
    this.router.post(
      "/pickup-request",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        body: PickupRequestValidation.CreatePickupRequestSchema,
      }),
      this.controller.createPickupRequest,
    );
  }
}

export default new PickupRequestRoute().router;
