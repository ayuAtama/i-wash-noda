import { MidtransService } from "@/services/midtrans.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { ParsedMidtransNotification } from "@/validations/midtrans.validation";

export class MidtransController {
  constructor(private midtransService: MidtransService) {}

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
