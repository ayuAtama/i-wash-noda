// apps/api/src/routes/routes.ts
//import { PickupRequestController } from "@/controllers/controller";
//import { PickupRequestService } from "@/services/pickupRequest.services";
import { Router } from "express";
import { SSEController } from "@/controllers/sse.controller";
import { sseService } from "@/services/sse.services";

export class PickupRequestRoute {
  public router = Router();
  private controller: SSEController;

  constructor() {
    this.controller = new SSEController(sseService);
    this.createPickupRequest();
    this.tesSendData();
  }

  private createPickupRequest() {
    this.router.get("/", this.controller.connect);
  }

  private tesSendData() {
    this.router.post("/", this.controller.sendData);
  }
}

export default new PickupRequestRoute().router;
