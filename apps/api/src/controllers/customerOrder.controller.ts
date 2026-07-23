import { CustomerOrderService } from "@/services/customerOrder.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  OrderIdParamsDTO,
  PaymentProofDTO,
  UserIdDTO,
} from "@/validations/customerOrder.validation";

export class CustomerOrderController {
  private CustomerOrderService: CustomerOrderService;

  constructor(CustomerOrderService: CustomerOrderService) {
    this.CustomerOrderService = CustomerOrderService;
  }

  checkActiveOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        (req.access_token?.sub as UserIdDTO) ?? (req.user?.id as UserIdDTO);
      if (!userId) throw new HttpError(401, "Invalid user id");
      const result =
        await this.CustomerOrderService.checkActiveOrderStatus(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  checkCompletedOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        (req.access_token?.sub as UserIdDTO) ?? (req.user?.id as UserIdDTO);
      if (!userId) throw new HttpError(401, "Invalid user id");
      const result =
        await this.CustomerOrderService.checkCompletedOrderStatus(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  uploadPaymentProof = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const { urlProof } = req.validated!.body as PaymentProofDTO;
      const { orderId } = req.validated!.params as OrderIdParamsDTO;
      if (!userId) throw new HttpError(401, "Invalid user id");
      if (!urlProof) throw new HttpError(400, "Invalid urlProof");
      if (!orderId) throw new HttpError(400, "Invalid orderId");
      const result = await this.CustomerOrderService.uploadPaymentProof({
        orderId,
        userId,
        urlProof,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
