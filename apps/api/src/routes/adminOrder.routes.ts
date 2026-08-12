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
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { authenticationMiddleware } from "@/middleware/authentication";
import { ResolveContext } from "@/middleware/resolveContext";
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        params: UpdateOrderItemValidation.OrderIdParamsSchema,
      }),
      this.controller.markDelivered,
    );
  }

  private getAllOrderOnTheOutlet() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllOrderOnOutlet,
    );
  }

  private updateItemOfOrder() {
    this.router.patch(
      "/:orderId",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      this.controller.checkCustomerPaymentProof,
    );

    this.router.post(
      "/payment-proof/:id/:action",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        params: PaymentOrderValidation.PaymentActionParamsSchema,
      }),
      this.controller.actionOfPaymentProof,
    );
  }

  private CustomerComplaints() {
    this.router.get(
      "/complaints",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      this.controller.getAllPendingComplaints,
    );

    this.router.post(
      "/complaints/:complaintId/:status",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        body: WalkInCustomerValidation.CreateWalkInCustomerSchema,
      }),
      this.controller.createNewWalkinCustomer,
    );
  }

  private checkWalkinCustomer() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        query: WalkInCustomerValidation.keywordWalkInCustomerSchema,
      }),
      this.controller.checkWalkinCustomer,
    );
  }

  private updateWalkinCustomer() {
    this.router.patch(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
      Validator.validate({
        params: UpdateWalkInCustomerValidation.IDParamSchema,
      }),
      this.controller.deleteWalkinCustomer,
    );
  }

  private manualCreateOrderWalkIn() {
    this.router.post(
      "/orders/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("outlet_admin"),
      ResolveContext.handler,
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
