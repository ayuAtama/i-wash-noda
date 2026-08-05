// src/routes/midtrans.routes.ts
import { Router } from "express";
import { MidtransController } from "@/controllers/midtrans.controller";
import { MidtransService } from "@/services/midtrans.services";

export class MidtransRoute {
  public router = Router();
  private controller: MidtransController;

  constructor() {
    this.controller = new MidtransController(new MidtransService());
    this.notification();
  }

  private notification() {
    this.router.post("/notification", this.controller.notification);
  }
}

export default new MidtransRoute().router;
