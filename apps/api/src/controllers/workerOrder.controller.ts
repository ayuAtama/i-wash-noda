import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { WorkerOrderService } from "@/services/workerOrder.services";
import {
  OrderIdParamsDTO,
  AcceptOrderInputDTO,
  FetchWorkerOrdersDTO,
} from "@/validations/workerOrder.validation";

export class WorkerOrderController {
  private workerOrderService: WorkerOrderService;

  constructor(workerOrderService: WorkerOrderService) {
    this.workerOrderService = workerOrderService;
  }

  getAvailableOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.context) throw new HttpError(401, "Unauthorized");
      const workerId = req.access_token?.sub ?? req.user?.id;
      if (!workerId) throw new HttpError(401, "Unauthorized");
      const outletId = req.context.outlet_id;
      const { page, limit } = req.validated!.query as FetchWorkerOrdersDTO;

      const result = await this.workerOrderService.getAvailableOrders(
        workerId,
        outletId,
        page,
        limit,
      );

      return res.status(200).json({
        success: true,
        message: "Available orders fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  acceptOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context) throw new HttpError(401, "Unauthorized");
      const workerId = req.access_token?.sub ?? req.user?.id;
      if (!workerId) throw new HttpError(401, "Unauthorized");
      const outletId = req.context.outlet_id;
      const { orderId } = req.validated!.params as OrderIdParamsDTO;
      const body = req.validated!.body as AcceptOrderInputDTO;

      const result = await this.workerOrderService.acceptOrder(
        workerId,
        outletId,
        orderId,
        body,
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  completeOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context) throw new HttpError(401, "Unauthorized");
      const workerId = req.access_token?.sub ?? req.user?.id;
      if (!workerId) throw new HttpError(401, "Unauthorized");
      const outletId = req.context.outlet_id;
      const { orderId } = req.validated!.params as OrderIdParamsDTO;

      const result = await this.workerOrderService.completeOrder(
        workerId,
        outletId,
        orderId,
      );

      return res.status(200).json({
        success: true,
        message: "Order station completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context) throw new HttpError(401, "Unauthorized");
      const workerId = req.access_token?.sub ?? req.user?.id;
      if (!workerId) throw new HttpError(401, "Unauthorized");
      const outletId = req.context.outlet_id;
      const { page, limit } = req.validated!.query as FetchWorkerOrdersDTO;

      const result = await this.workerOrderService.getOrderHistory(
        workerId,
        outletId,
        page,
        limit,
      );

      return res.status(200).json({
        success: true,
        message: "Order history fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
