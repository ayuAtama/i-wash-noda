// apps/api/src/controllers/controller.ts
import { PickupRequestService } from "@/services/pickupRequest.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";

export class PickupRequestController {
  private pickupRequestService: PickupRequestService;

  constructor(pickupRequestService: PickupRequestService) {
    this.pickupRequestService = pickupRequestService;
  }

  async createPickupRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const pickupRequest = await this.pickupRequestService.createPickupRequest(
        userId,
        data
      );
      res.status(201).json(pickupRequest);
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
      } else {
        next(new HttpError(500, "Internal server error"));
      }
    }
  }
}
