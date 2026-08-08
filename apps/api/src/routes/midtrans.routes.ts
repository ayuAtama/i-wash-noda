import { Router } from "express";
import { MidtransController } from "@/controllers/midtrans.controller";
import { MidtransService } from "@/services/midtrans.services";
import { MidtransValidation } from "@/validations/midtrans.validation";
import { Validator } from "@/middleware/validate";

class MidtransRoute {
  public router = Router();

  constructor(private controller: MidtransController) {
    this.notificationWebhook();
  }

  private notificationWebhook() {
    this.router.post(
      "/notification",
      Validator.validate({
        body: MidtransValidation.MidtransNotificationSchema,
      }),
      this.controller.handleWebhookNotification,
    );
  }
}

export default new MidtransRoute(new MidtransController(new MidtransService()))
  .router;
