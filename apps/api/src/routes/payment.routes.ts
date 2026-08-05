// src/routes/payment.routes.ts
import { Router } from "express";
import { PaymentController } from "@/controllers/payment.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { PaymentValidation } from "@/validations/payment.validation";
import { PaymentService } from "@/services/payment.services";
import { MidtransController } from "@/controllers/midtrans.controller";
import { MidtransService } from "@/services/midtrans.services";
import { cloudinaryUploadMiddleware } from "@/middleware/cloudinary.middleware";

export class PaymentRoute {
  public router = Router();
  private controller: PaymentController;
  private midtransController: MidtransController;

  constructor() {
    this.controller = new PaymentController(new PaymentService());
    this.midtransController = new MidtransController(new MidtransService());
    this.uploadProof();
    this.getProof();
    this.pay();
    this.paymentStatus();
  }

  private uploadProof() {
    this.router.post(
      "/:id/payment-proof",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      resolveContext,
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
      }),
      cloudinaryUploadMiddleware("proof", {
        type: "image",
      }),
      this.controller.uploadProof,
    );
  }

  private getProof() {
    this.router.get(
      "/:id/payment-proof",
      authenticationMiddleware,
      resolveContext,
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
      }),
      this.controller.getProof,
    );
  }

  private pay() {
    this.router.post(
      "/:id/pay",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
      }),
      this.midtransController.pay,
    );
  }

  private paymentStatus() {
    this.router.get(
      "/:id/payment-status",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
      }),
      this.midtransController.paymentStatus,
    );

    this.router.post(
      "/:id/payment-sync",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
      }),
      this.midtransController.syncPaymentStatus,
    );
  }
}

export default new PaymentRoute().router;
