import { Router } from "express";
import { CustomerOrderController } from "@/controllers/customerOrder.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { CustomerOrderValidation } from "@/validations/customerOrder.validation";
import { CustomerOrderService } from "@/services/customerOrder.services";

class CustomerOrderRoute {
  public router = Router();
  private controller: CustomerOrderController;

  constructor(controller: CustomerOrderController) {
    this.controller = controller;
    this.customerOrder();
    this.listOrders();
    this.complaint();
    this.markDone();
    this.paymentEndpoints();
  }

  private listOrders() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      this.controller.getMyOrders,
    );
  }

  private customerOrder() {
    this.router.get(
      "/active",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      this.controller.checkActiveOrderStatus,
    );

    this.router.get(
      "/complete",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      this.controller.checkCompletedOrderStatus,
    );
  }

  private paymentEndpoints() {
    this.router.post(
      "/:orderId/payment",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      Validator.validate({
        params: CustomerOrderValidation.OrderIdParamsSchema,
        body: CustomerOrderValidation.PaymentProofSchema,
      }),
      this.controller.uploadPaymentProof,
    );

    this.router.post(
      "/:orderId/payment/cancel",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      Validator.validate({
        params: CustomerOrderValidation.OrderIdParamsSchema,
      }),
      this.controller.cancelPayment,
    );

    this.router.get(
      "/:orderId/payment-gateway",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      Validator.validate({
        params: CustomerOrderValidation.OrderIdParamsSchema,
      }),
      this.controller.payWithPaymentGateway,
    );

    this.router.post(
      "/:orderId/payment/:paymentMethod",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      Validator.validate({
        params: CustomerOrderValidation.setPaymentMethodParams,
      }),
      this.controller.setPaymentMethod,
    );
  }

  private markDone() {
    this.router.post(
      "/:orderId/complete",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      Validator.validate({
        params: CustomerOrderValidation.OrderIdParamsSchema,
      }),
      this.controller.markDone,
    );
  }

  private complaint() {
    this.router.post(
      "/:orderId/complaint",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("customer"),
      Validator.validate({
        params: CustomerOrderValidation.OrderIdParamsSchema,
        body: CustomerOrderValidation.ComplainSchema,
      }),
      this.controller.complaint,
    );
  }
}

export default new CustomerOrderRoute(
  new CustomerOrderController(new CustomerOrderService()),
).router;
