// apps/api/src/controllers/controller.ts
import { PickupRequestService } from "@/services/pickupRequest.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";

export class PickupRequestController {
  private pickupRequestService: PickupRequestService;

  constructor(pickupRequestService: PickupRequestService) {
    this.pickupRequestService = pickupRequestService;
  }

  createPickupRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // from middlewere
      const userId = req.user?.id ?? req.access_token?.sub;
      if (!userId) throw new HttpError(401, "Invalid user id");
      // from frontend form
      const { addressId, outletId } = req.body;
      // call the servuice
      const pickupRequest = await this.pickupRequestService.createPickupRequest(
        userId,
        addressId,
        outletId
      );
      res.status(201).json(pickupRequest);
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
      } else {
        next(new HttpError(500, "Internal server error"));
      }
    }
  };
}
