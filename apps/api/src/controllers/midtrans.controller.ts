// src/controllers/midtrans.controller.ts
import { MidtransService } from "@/services/midtrans.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { OrderIdParamsDto } from "@/validations/payment.validation";

export class MidtransController {
  private service: MidtransService;

  constructor(service: MidtransService) {
    this.service = service;
  }

  pay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const data = await this.service.createPayment(orderId, userId);
      res.status(200).json({
        success: true,
        message: "Midtrans Snap token generated",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  notification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.handleNotification(req.body);
      res.status(200).json({
        success: true,
        message: "Notification processed",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  paymentStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const data = await this.service.getPaymentStatus(orderId, userId);
      res.status(200).json({
        success: true,
        message: "Payment status fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
