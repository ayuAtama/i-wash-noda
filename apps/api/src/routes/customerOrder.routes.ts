import { Router } from "express";
import { CustomerOrderController } from "@/controllers/customerOrder.controller";
import { CustomerOrderService } from "@/services/customerOrder.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";

class CustomerOrderRoute {
  public router = Router();
  private controller: CustomerOrderController;

  constructor() {
    this.controller = new CustomerOrderController(new CustomerOrderService());
    this.customerOrder();
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
}

export default new CustomerOrderRoute().router;
