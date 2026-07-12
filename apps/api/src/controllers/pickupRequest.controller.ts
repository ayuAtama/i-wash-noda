// apps/api/src/controllers/controller.ts
import { PickupRequestService } from "@/services/pickupRequest.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreatePickupRequestDto,
  PickupRequestIdParamsDto,
} from "@/validations/pickupRequest.validation";

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
      if (!userId) throw new HttpError(401, "Invalid user id");

      // call the service
      const { success, message, availableOutlets, data, address } =
        await this.pickupRequestService.checkAddressFirst(userId);

      //response
      if (success) {
        res.status(200).json({
          success: success,
          message: message,
          data: {
            nearestOutlet: availableOutlets,
            address,
          },
        });
      } else {
        res.status(409).json({
          success,
          message,
          data,
        });
      }
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
      const payload = req.validated!.body as CreatePickupRequestDto;
      if (!payload) throw new HttpError(400, "Missing addressId or outletId");

      // call the servuice
      const pickupRequest = await this.pickupRequestService.createPickupRequest(
        userId,
        payload,
      );
      res.status(201).json({
        success: true,
        message: "Pickup request created successfully",
        data: pickupRequest,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
      } else {
        next(error);
      }
    }
  };

  cancelPickupRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the id from middlewere
      const userId = req.user?.id ?? req.access_token?.sub;
      if (!userId) throw new HttpError(401, "Invalid user id");

      // from the frontend error from check address
      if (!req.validated) {
        throw new HttpError(
          400,
          "Please don't hack me, otherwise you forgot your pickup request id",
        );
      }

      const { id: pickupRequestOrderId } = req.validated
        .params as PickupRequestIdParamsDto;

      if (!pickupRequestOrderId)
        throw new HttpError(400, "Missing pickupRequestOrderId");

      // call the service
      const { success, message, data } =
        await this.pickupRequestService.cancelPickupRequest(
          userId,
          pickupRequestOrderId,
        );

      // response
      res.status(200).json({ success, message, data });
    } catch (error) {
      next(error);
    }
  };

  checkOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the id from middlewere
      const userId = req.user?.id ?? req.access_token?.sub;
      if (!userId) throw new HttpError(401, "Invalid user id");

      // call the service
      const { success, message, data } =
        await this.pickupRequestService.checkOrderStatus(userId);

      // response
      res.status(200).json({ success, message, data });
    } catch (error) {
      next(error);
    }
  };
}
