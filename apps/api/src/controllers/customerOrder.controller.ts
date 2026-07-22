import { CustomerOrderService } from "@/services/customerOrder.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { UserIdDto } from "@/validations/customerOrder.validation";

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
        (req.access_token?.sub as UserIdDto) ?? (req.user?.id as UserIdDto);
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
        (req.access_token?.sub as UserIdDto) ?? (req.user?.id as UserIdDto);
      if (!userId) throw new HttpError(401, "Invalid user id");
      const result =
        await this.CustomerOrderService.checkCompletedOrderStatus(userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
