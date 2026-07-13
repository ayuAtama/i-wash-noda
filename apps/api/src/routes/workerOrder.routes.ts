import { Router } from "express";
import { WorkerOrderController } from "@/controllers/workerOrder.controller";
import { WorkerOrderService } from "@/services/workerOrder.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import {
  OrderIdParamsSchema,
  AcceptOrderSchema,
  FetchWorkerOrdersSchema,
} from "@/validations/workerOrder.validation";
import { resolveContext } from "@/middleware/resolveContext";

export class WorkerOrderRoute {
  public router = Router();
  private controller: WorkerOrderController;

  constructor() {
    this.controller = new WorkerOrderController(new WorkerOrderService());
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      "/available",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        query: FetchWorkerOrdersSchema,
      }),
      this.controller.getAvailableOrders
    );

    this.router.get(
      "/history",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        query: FetchWorkerOrdersSchema,
      }),
      this.controller.getOrderHistory
    );

    this.router.post(
      "/:orderId/accept",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        params: OrderIdParamsSchema,
        body: AcceptOrderSchema,
      }),
      this.controller.acceptOrder
    );

    this.router.post(
      "/:orderId/complete",
      authenticationMiddleware,
      authorizationMiddleware("worker"),
      resolveContext,
      Validator.validate({
        params: OrderIdParamsSchema,
      }),
      this.controller.completeOrder
    );
  }
}

export default new WorkerOrderRoute().router;
