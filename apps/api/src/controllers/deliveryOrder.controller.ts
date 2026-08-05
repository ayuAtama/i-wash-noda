// src/controllers/deliveryOrder.controller.ts
import { DeliveryOrderService } from "@/services/deliveryOrder.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { DeliveryIdParamsDto } from "@/validations/delivery.validation";
import { PaginationDTO } from "@/validations/pagination.validation";

export class DeliveryOrderController {
  private service: DeliveryOrderService;

  constructor(service: DeliveryOrderService) {
    this.service = service;
  }

  getAllDeliveryRequests = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub;
      const outletId = req.context?.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const result = await this.service.getAllDeliveryRequests(
        userId,
        outletId,
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        message: "Delivery requests fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  acceptDeliveryRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub;
      const outletId = req.context?.outlet_id;
      const { id } = req.validated!.params as DeliveryIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const result = await this.service.acceptDeliveryRequest(
        id,
        userId,
        outletId,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  updateDeliveryStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub;
      const { id } = req.validated!.params as DeliveryIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const result = await this.service.updateDeliveryStatus(userId, id);
      res.status(200).json({
        success: true,
        message: "Delivery status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAcceptedDeliveries = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub;
      const outletId = req.context?.outlet_id;
      const { page, limit } = req.validated!.query as PaginationDTO;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const result = await this.service.getAcceptedDeliveries(
        userId,
        outletId,
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        message: "Accepted deliveries fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompletedDeliveries = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub;
      const { page, limit } = req.validated!.query as PaginationDTO;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const result = await this.service.getCompletedDeliveries(
        userId,
        page,
        limit,
      );
      res.status(200).json({
        success: true,
        message: "Completed deliveries fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };
}
