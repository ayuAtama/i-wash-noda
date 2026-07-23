import { Router } from "express";
import { CustomerOrderController } from "@/controllers/customerOrder.controller";
import { CustomerOrderService } from "@/services/customerOrder.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { CustomerOrderValidation } from "@/validations/customerOrder.validation";

class CustomerOrderRoute {
  public router = Router();
  private controller: CustomerOrderController;

  constructor() {
    this.controller = new CustomerOrderController(new CustomerOrderService());
    this.customerOrder();
    this.uploadPaymentProof();
  }

  private customerOrder() {
    this.router.get(
      "/active",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.checkActiveOrderStatus,
    );

    this.router.get(
      "/complete",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      this.controller.checkCompletedOrderStatus,
    );
  }

  private uploadPaymentProof() {
    this.router.post(
      "/:orderId/payment",
      authenticationMiddleware,
      authorizationMiddleware("customer"),
      Validator.validate({
        params: CustomerOrderValidation.OrderIdParamsSchema,
        body: CustomerOrderValidation.PaymentProofSchema,
      }),
      this.controller.uploadPaymentProof,
    );
  }
}

export default new CustomerOrderRoute().router;
