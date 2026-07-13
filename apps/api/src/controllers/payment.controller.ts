// src/controllers/payment.controller.ts
import { PaymentService } from "@/services/payment.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  OrderIdParamsDto,
  PaymentConfirmDto,
  PaymentRejectDto,
} from "@/validations/payment.validation";

export class PaymentController {
  private service: PaymentService;

  constructor(service: PaymentService) {
    this.service = service;
  }

  uploadProof = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const file = req.file;
      if (!file) throw new HttpError(400, "Payment proof image is required");

      const data = await this.service.uploadPaymentProof(
        orderId,
        userId,
        file.path,
      );

      res.status(201).json({
        success: true,
        message: "Payment proof uploaded successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getProof = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      const data = await this.service.getPaymentProof(orderId);
      res.status(200).json({
        success: true,
        message: "Payment proof fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const outletId = req.context?.outlet_id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const data = await this.service.confirmPayment(orderId, userId, outletId);
      res.status(200).json({
        success: true,
        message: "Payment confirmed successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outletId = req.context?.outlet_id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      const { reason } = req.validated!.body as PaymentRejectDto;
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const data = await this.service.rejectPaymentProof(
        orderId,
        outletId,
        reason,
      );
      res.status(200).json({
        success: true,
        message: "Payment proof rejected",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
