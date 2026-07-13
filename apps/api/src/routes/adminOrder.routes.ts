// apps/api/src/routes/adminOrder.routes.ts
import { Router } from "express";
import { AdminOrderController } from "@/controllers/adminOrder.controller";
import { Validator } from "@/middleware/validate";
import { AdminOrderService } from "@/services/adminOrder.services";
import {
  AdminOrderValidation,
  ManualOrderValidation,
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

  constructor() {
    this.controller = new AdminOrderController(new AdminOrderService());
    //this.createOrder();
    this.createWalkinCustomerOrder();
    this.checkWalkinCustomer();
    this.updateWalkinCustomer();
    this.deleteWalkinCustomer();
    this.manualCreateOrderWalkIn();
    this.getAllOrderOnTheOutlet();
    this.updateItemOfOrder();
    this.markDelivered();
  }

  // private createOrder() {
  //   this.router.put(
  //     "/orders/:id",
  //     Validator.validate({
  //       body: AdminOrderValidation.AdminOrderSchema,
  //       params: AdminOrderValidation.AdminOrderParamsSchema,
  //     }),
  //     this.controller.createOrder,
  //   );
  // }

  private createWalkinCustomerOrder() {
    this.router.post(
      "/walk-in-customer",
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
      "/walk-in-customer",
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
      "/walk-in-customer/:id",
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
      "/walk-in-customer/:id",
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
      "/walk-in-customer/orders",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        body: ManualOrderValidation.CreateManualOrderSchema,
      }),
      this.controller.manualCreateOrderWalkIn,
    );
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
}

export default new AdminOrderRoute().router;
