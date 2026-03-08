// apps/api/src/controllers/controller.ts
import { PickupRequestService } from "@/services/pickupRequest.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { CreatePickupRequestDto } from "@/validations/pickupRequest.validation";

export class PickupRequestController {
  private pickupRequestService: PickupRequestService;

  constructor(pickupRequestService: PickupRequestService) {
    this.pickupRequestService = pickupRequestService;
  }

  // check if the user already has address and return available outlets
  checkAddressFirst = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the id from middlewere
      const userId = req.user?.id ?? req.access_token?.sub;
      console.log(userId);
      if (!userId) throw new HttpError(401, "Invalid user id");

      // call the service
      const { success, message, withinCoverage } =
        await this.pickupRequestService.checkAddressFirst(userId);

      //response
      res.status(200).json({
        success: success,
        message: message,
        data: withinCoverage,
      });
    } catch (error) {
      next(error);
    }
  };

  createPickupRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // from middlewere
      const userId = req.user?.id ?? req.access_token?.sub;
      if (!userId) throw new HttpError(401, "Invalid user id");

      // from frontend form (from previous function)
      // if(!req.body) throw new HttpError(400, "Missing body");
      // const { addressId, outletId } = req.body;
      const { addressId, outletId } = req.validated!
        .body as CreatePickupRequestDto;
      if (!addressId || !outletId)
        throw new HttpError(400, "Missing addressId or outletId");

      // call the servuice
      const pickupRequest = await this.pickupRequestService.createPickupRequest(
        userId,
        addressId,
        outletId,
      );
      res.status(201).json(pickupRequest);
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
}
