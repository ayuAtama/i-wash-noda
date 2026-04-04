// apps/api/src/routes/adminOrder.routes.ts
import { Router } from "express";
import { AdminOrderController } from "@/controllers/adminOrder.controller";
import { Validator } from "@/middleware/validate";
import { AdminOrderService } from "@/services/adminOrder.services";
import { AdminOrderValidation } from "@/validations/adminOrder.validation";

export class AdminOrderRoute {
  public router = Router();
  private controller: AdminOrderController;

  constructor() {
    this.controller = new AdminOrderController(new AdminOrderService());
    this.createOrder();
  }

  private createOrder() {
    this.router.put(
      "/orders/:id",
      Validator.validate({
        body: AdminOrderValidation.AdminOrderSchema,
        params: AdminOrderValidation.AdminOrderParamsSchema,
      }),
      this.controller.createOrder,
    );
  }
}

export default new AdminOrderRoute().router;
