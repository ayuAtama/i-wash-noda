// src/routes/payment.routes.ts
import { Router } from "express";
import { PaymentController } from "@/controllers/payment.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { PaymentValidation } from "@/validations/payment.validation";
import { PaymentService } from "@/services/payment.services";
import { cloudinaryUploadMiddleware } from "@/middleware/cloudinary.middleware";

export class PaymentRoute {
  public router = Router();
  private controller: PaymentController;

  constructor() {
    this.controller = new PaymentController(new PaymentService());
    this.uploadProof();
    this.getProof();
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
}

export default new PaymentRoute().router;
