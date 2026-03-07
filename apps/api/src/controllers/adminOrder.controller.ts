// apps/api/src/controllers/adminOrder.controller.ts
import { AdminOrderService } from "@/services/adminOrder.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { AdminOrderInput } from "@/validations/adminOrder.validation";

export class AdminOrderController {
  private adminOrderService: AdminOrderService;

  constructor(adminOrderService: AdminOrderService) {
    this.adminOrderService = adminOrderService;
  }

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. validate request body
      const body = req.validated!.body as AdminOrderInput;

      const params = req.validated?.params as { id: string };
      if (!params.id) throw new HttpError(400, "Missing order id");

      const outletId = req.context?.outlet_id;
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      // 2. call service after used middleware (DTO validation)
      const result = await this.adminOrderService.createOrder(
        body,
        params.id,
        outletId
      );

      // 3. response
      return res.status(200).json({
        message: "Order created",
        order: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
