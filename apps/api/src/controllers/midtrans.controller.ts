// src/controllers/midtrans.controller.ts
import { MidtransService } from "@/services/midtrans.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { OrderIdParamsDto } from "@/validations/payment.validation";
import { ParsedMidtransNotification } from "@/validations/midtrans.validation";

export class MidtransController {
  constructor(private midtransService: MidtransService) {}

  pay = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const data = await this.midtransService.createPayment(orderId, userId);
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
      const data = await this.midtransService.handleNotification(req.body);
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

      const data = await this.midtransService.getPaymentStatus(orderId, userId);
      res.status(200).json({
        success: true,
        message: "Payment status fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  syncPaymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const { id: orderId } = req.validated!.params as OrderIdParamsDto;
      if (!userId) throw new HttpError(401, "Unauthorized");

      const data = await this.midtransService.syncPaymentStatus(
        orderId,
        userId,
      );
      res.status(200).json({
        success: true,
        message: "Payment status synced with Midtrans",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  handleWebhookNotification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const parsedBody = req.validated!.body as ParsedMidtransNotification;
      const rawBody = req.body;
      if (!parsedBody || !rawBody) {
        throw new HttpError(400, "Invalid request");
      }

      const result = await this.midtransService.handleWebhookNotification({
        parsedData: parsedBody,
        rawData: rawBody,
      });

      res.status(200).json({
        success: true,
        message: "Webhook notification processed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
