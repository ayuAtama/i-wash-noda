// apps/api/src/controllers/outletItem.controller.ts
import { OutletItemService } from "@/services/outletItem.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";

export class OutletItemController {
  private outletItemService: OutletItemService;

  constructor(outletItemService: OutletItemService) {
    this.outletItemService = outletItemService;
  }

  outletCoverage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the data
      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);
      if (!lat || !lng)
        throw new HttpError(
          400,
          "Missing lat or lng, please allow location permission"
        );

      // fetch it
      const outletCoverage = await this.outletItemService.getAll(lat, lng);

      if (outletCoverage.length === 0) {
        throw new HttpError(
          404,
          "At this moment there is no outlets in your area"
        );
      }

      res.status(200).json({
        success: true,
        message: "Outlet coverage fetched successfully",
        data: outletCoverage,
      });
    } catch (error) {
      next(error);
    }
  };
}
