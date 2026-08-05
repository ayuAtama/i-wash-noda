// src/routes/adminPayment.routes.ts
import { Router } from "express";
import { PaymentController } from "@/controllers/payment.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { PaymentValidation } from "@/validations/payment.validation";
import { PaymentService } from "@/services/payment.services";

export class AdminPaymentRoute {
  public router = Router();
  private controller: PaymentController;

  constructor() {
    this.controller = new PaymentController(new PaymentService());
    this.confirm();
    this.reject();
  }

  private confirm() {
    this.router.patch(
      "/:id/payment-confirm",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
        body: PaymentValidation.PaymentConfirmSchema,
      }),
      this.controller.confirm,
    );
  }

  private reject() {
    this.router.patch(
      "/:id/payment-reject",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: PaymentValidation.OrderIdParamsSchema,
        body: PaymentValidation.PaymentRejectSchema,
      }),
      this.controller.reject,
    );
  }
}

export default new AdminPaymentRoute().router;
