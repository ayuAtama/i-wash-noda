// apps/api/src/routes/adminOrder.routes.ts
import { AdminOrderController } from "@/controllers/adminOrder.controller";
import { Validator } from "@/middleware/validate";
import { AdminOrderService } from "@/services/adminOrder.services";
import { AdminOrderSchema } from "@/validations/adminOrder.validation";
import { Router } from "express";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";

export class AdminOrderRoute {
  public router = Router();
  private controller: AdminOrderController;

  constructor() {
    this.controller = new AdminOrderController(new AdminOrderService());
    this.createOrder();
  }

  private createOrder() {
    this.router.put(
      "/order/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      Validator.validate({
        body: AdminOrderSchema,
      }),
      this.controller.createOrder,
    );
  }
}

export default new AdminOrderRoute().router;
