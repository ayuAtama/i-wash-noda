import type { Request, Response, NextFunction } from "express";
import { DeliveryOrderService } from "@/services/deliverOrder.services";
import { HttpError } from "@/utils/httpError";
import { DeliveryIdParamsDTO } from "@/validations/deliveryOder.validation";

export class DeliveryOrderController {
  private DeliveryOrderService: DeliveryOrderService;

  constructor(DeliveryOrderService: DeliveryOrderService) {
    this.DeliveryOrderService = DeliveryOrderService;
  }

  available = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context)
        throw new HttpError(
          500,
          "The Dev forgets to attach the resolve context middleware",
        );
      const { outlet_id: outletId } = req.context;
      const result =
        await this.DeliveryOrderService.getAllDeliveryRequests(outletId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context)
        throw new HttpError(
          500,
          "The Dev forgets to attach the resolve context middleware",
        );
      const { outlet_id: outletId } = req.context;
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Unauthorized, login first");
      const { deliveryId } = req.validated!.params as DeliveryIdParamsDTO;
      const acceptDelivery =
        await this.DeliveryOrderService.acceptDeliveryRequest(
          outletId,
          deliveryId,
          userId,
        );
      res.status(200).json(acceptDelivery);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Unauthorized, login first");
      const { deliveryId } = req.validated!.params as DeliveryIdParamsDTO;
      const updateStatus = await this.DeliveryOrderService.upateStatusDriver(
        userId,
        deliveryId,
      );
      res.status(200).json(updateStatus);
    } catch (err) {
      next(err);
    }
  };

  activeJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context)
        throw new HttpError(
          500,
          "The Dev forgets to attach the resolve context middleware",
        );
      const { outlet_id: outletId } = req.context;
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Unauthorized, login first");
      const activeJobs =
        await this.DeliveryOrderService.getAcceptedDeliveryRequests(
          userId,
          outletId,
        );
      res.status(200).json(activeJobs);
    } catch (err) {
      next(err);
    }
  };

  completedJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.context)
        throw new HttpError(
          500,
          "The Dev forgets to attach the resolve context middleware",
        );
      const { outlet_id: outletId } = req.context;
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Unauthorized, login first");
      const completedJobs =
        await this.DeliveryOrderService.getALLAlreadyDeliveredRequests(
          userId,
          outletId,
        );
      res.status(200).json(completedJobs);
    } catch (err) {
      next(err);
    }
  };
}
