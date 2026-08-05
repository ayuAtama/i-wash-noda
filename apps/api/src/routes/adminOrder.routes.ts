// apps/api/src/routes/adminOrder.routes.ts
import { Router } from "express";
import { AdminOrderController } from "@/controllers/adminOrder.controller";
import { Validator } from "@/middleware/validate";
import { AdminOrderService } from "@/services/adminOrder.services";

import {
  AdminOrderValidation,
  ComplaintOrderValidation,
  ManualOrderValidation,
  PaymentOrderValidation,
  UpdateOrderItemValidation,
  UpdateWalkInCustomerValidation,
  WalkInCustomerValidation,
} from "@/validations/adminOrder.validation";
import { authorizationMiddleware } from "@/middleware/authorization";
import { authenticationMiddleware } from "@/middleware/authentication";
import { resolveContext } from "@/middleware/resolveContext";
import { PaymentValidation } from "@/validations/payment.validation";
import { PaginationSchema } from "@/validations/pagination.validation";

export class AdminOrderRoute {
  public router = Router();
  private controller: AdminOrderController;

  constructor(controller: AdminOrderController) {
    this.controller = controller;
    this.getAllOrderOnTheOutlet();
    this.updateItemOfOrder();
    this.PaymentProof();
    this.CustomerComplaints();
    this.markDelivered();

  }

  private markDelivered() {
    this.router.patch(
      "/orders/:orderId/deliver",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: UpdateOrderItemValidation.OrderIdParamsSchema,
      }),
      this.controller.markDelivered,
    );
  }

  private getAllOrderOnTheOutlet() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllOrderOnOutlet,
    );
  }

  private updateItemOfOrder() {
    this.router.patch(
      "/:orderId",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        body: UpdateOrderItemValidation.UpdateOrderItemSchema,
        params: UpdateOrderItemValidation.OrderIdParamsSchema,
      }),
      this.controller.updateItemOfOrder,
    );
  }

  private PaymentProof() {
    this.router.get(
      "/payment-proof/",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      this.controller.checkCustomerPaymentProof,
    );

    this.router.post(
      "/payment-proof/:id/:action",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: PaymentOrderValidation.PaymentActionParamsSchema,
      }),
      this.controller.actionOfPaymentProof,
    );
  }

  private CustomerComplaints() {
    this.router.get(
      "/complaints",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      this.controller.getAllPendingComplaints,
    );

    this.router.post(
      "/complaints/:complaintId/:status",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: ComplaintOrderValidation.ComplaintParamsSchema,
        body: ComplaintOrderValidation.ComplaintBodySchema,
      }),
      this.controller.actionOfCustomerComplaint,
    );
  }
}

export class AdminWalkInOrderRoute {
  public router = Router();
  private controller: AdminOrderController;

  constructor(controller: AdminOrderController) {
    this.controller = controller;
    this.createWalkinCustomerOrder();
    this.checkWalkinCustomer();
    this.updateWalkinCustomer();
    this.deleteWalkinCustomer();
    this.manualCreateOrderWalkIn();
  }

  private createWalkinCustomerOrder() {
    this.router.post(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        body: WalkInCustomerValidation.CreateWalkInCustomerSchema,
      }),
      this.controller.createNewWalkinCustomer,
    );
  }

  private checkWalkinCustomer() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        query: WalkInCustomerValidation.keywordWalkInCustomerSchema,
      }),
      this.controller.checkWalkinCustomer,
    );
  }

  private updateWalkinCustomer() {
    this.router.patch(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: UpdateWalkInCustomerValidation.IDParamSchema,
        body: UpdateWalkInCustomerValidation.UpdateWalkInCustomerSchema,
      }),
      this.controller.updateWalkinCustomer,
    );
  }

  private deleteWalkinCustomer() {
    this.router.delete(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: UpdateWalkInCustomerValidation.IDParamSchema,
      }),
      this.controller.deleteWalkinCustomer,
    );
  }

  private manualCreateOrderWalkIn() {
    this.router.post(
      "/orders/:id",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: ManualOrderValidation.WalkInCustomerIdParamsSchema,
        body: ManualOrderValidation.CreateManualOrderSchema,
      }),
      this.controller.manualCreateOrderWalkIn,
    );
  }
}

const controller = new AdminOrderController(new AdminOrderService());
export const adminWalkInOrderRoutes = new AdminWalkInOrderRoute(controller)
  .router;
export default new AdminOrderRoute(controller).router;
