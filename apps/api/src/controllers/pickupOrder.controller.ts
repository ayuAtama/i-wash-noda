// apps/api/src/controllers/pickupOrder.controller.ts
import { PickupOrderService } from "@/services/pickupOrder.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";

export class PickupOrderController {
  private pickupOrderService: PickupOrderService;

  constructor(pickupOrderService: PickupOrderService) {
    this.pickupOrderService = pickupOrderService;
  }

  // get all the pickup requests based on outlet id
  getAllPickupRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const outletId = req.context?.outlet_id;
      if (!outletId) throw new HttpError(401, "Outlet id not found");
      const pickupRequests =
        await this.pickupOrderService.getAllPickupRequests(outletId);
      res.status(200).json({
        status: "success",
        message: "Pickup requests fetched successfully",
        pickupRequests,
      });
    } catch (error) {
      next(error);
    }
  };

  acceptPickupRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pickupRequestId = req.params.id;
      const outletId = req.context?.outlet_id;
      const userId = req.access_token?.sub;
      if (!outletId) throw new HttpError(401, "Outlet id not found");
      if (!userId) throw new HttpError(401, "User id not found");
      if (!pickupRequestId)
        throw new HttpError(400, "Pickup request id not found");

      const { success, message, data } =
        await this.pickupOrderService.acceptPickupRequest(
          outletId,
          pickupRequestId,
          userId
        );
      res.status(200).json({
        success: success,
        message: message,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getAcceptedPickupRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.access_token?.sub;
      const outletId = req.context?.outlet_id;
      console.log(userId, outletId);
      if (!outletId) throw new HttpError(401, "Outlet id not found");
      if (!userId) throw new HttpError(401, "User id not found");

      const result = await this.pickupOrderService.getAcceptedPickupRequests(
        userId,
        outletId
      );
      res.status(200).json({
        status: "success",
        message: "Pickup requests fetched successfully",
        result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pickupRequestId = req.params.id;
      const userId = req.access_token?.sub;
      const status = req.body.status;
      if (!userId) throw new HttpError(401, "User id not found");
      if (!pickupRequestId)
        throw new HttpError(400, "Pickup request id not found");
      if (!status) throw new HttpError(400, "Status not found");

      const result = await this.pickupOrderService.upateStatusDriver(
        userId,
        pickupRequestId,
        status
      );
      res.status(200).json({
        status: "success",
        message: "Job status updated successfully",
        result,
      });
    } catch (error) {
      next(error);
    }
  };
}
