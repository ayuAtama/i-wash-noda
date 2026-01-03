// apps/api/src/routes/routes.ts
import { PickupRequestController } from "@/controllers/pickupRequest.controller";
import { PickupRequestService } from "@/services/pickupRequest.services";
import { Router } from "express";

export class PickupRequestRoute {
  public router = Router();
  private controller: PickupRequestController;

  constructor() {
    this.controller = new PickupRequestController(new PickupRequestService());
    this.createPickupRequest();
  }

  private createPickupRequest() {
    this.router.post("/pickup-request", this.controller.createPickupRequest);
  }
}

export default new PickupRequestRoute().router;
