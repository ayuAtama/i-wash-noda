// apps/api/src/routes/adminOrder.routes.ts
import { Router } from "express";
import { AdminOrderController } from "@/controllers/adminOrder.controller";
import { Validator } from "@/middleware/validate";
import { AdminOrderService } from "@/services/adminOrder.services";
import {
  AdminOrderValidation,
  ManualOrderValidation,
  WalkInCustomerValidation,
} from "@/validations/adminOrder.validation";
import { authorizationMiddleware } from "@/middleware/authorization";
import { authenticationMiddleware } from "@/middleware/authentication";
import { resolveContext } from "@/middleware/resolveContext";

export class AdminOrderRoute {
  public router = Router();
  private controller: AdminOrderController;

  constructor() {
    this.controller = new AdminOrderController(new AdminOrderService());
    //this.createOrder();
    this.createWalkinCustomerOrder();
    this.checkWalkinCustomer();
    this.manualCreateOrderWalkIn();
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
      Validator.validate({
        query: WalkInCustomerValidation.keywordWalkInCustomerSchema,
      }),
      this.controller.checkWalkinCustomer,
    );
  }

  private manualCreateOrderWalkIn() {
    this.router.post(
      "/walk-in-customer/order",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        body: ManualOrderValidation.CreateManualOrderSchema,
      }),
      this.controller.manualCreateOrderWalkIn,
    );
  }
}

export default new AdminOrderRoute().router;
