// apps/api/src/controllers/outlet.controller.ts
import { OutletService } from "@/services/outlet.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreateOutletDto,
  OutletCoverageQueryDto,
  OutletIdParamDto,
} from "@/validations/outlet.validation";

export class OutletController {
  private outletService: OutletService;

  constructor(outletService: OutletService) {
    this.outletService = outletService;
  }

  outletCoverage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the data
      const query = req.validated!.query as OutletCoverageQueryDto;
      const { lat, lng } = query;
      //      const lat = Number(req.query.lat);
      //      const lng = Number(req.query.lng);
      if (!lat || !lng)
        throw new HttpError(
          400,
          "Missing lat or lng, please allow location permission",
        );

      // fetch it
      const outletCoverage = await this.outletService.outletCoverage(lat, lng);

      if (outletCoverage.length === 0) {
        throw new HttpError(
          404,
          "At this moment there is no outlets in your area",
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

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const outlets = await this.outletService.getAll();
      res.json({
        success: true,
        message: "Outlets fetched successfully",
        data: outlets,
      });
    } catch (error) {
      next(error);
    }
  };

  createOutlet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const role = req.access_token?.role ?? req.user?.role;
      // more safety
      if (role !== "super_admin") throw new HttpError(403, "Forbidden");
      const payload = req.validated!.body as CreateOutletDto;
      if (!userId) throw new HttpError(401, "Invalid user id");
      const outlet = await this.outletService.createOutlet(userId, payload);
      res.status(201).json({
        success: true,
        message: "Outlet created successfully",
        data: outlet,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOutlet = async (req: Request, res: Response, next: NextFunction) => {
    const { id: outletId } = req.validated!.params as OutletIdParamDto;
    const body = req.validated!.body as CreateOutletDto;
    // const id = (req.validated!.params as OutletIdParamDto).id;
    // console.log(outletId, id);

    // more safety
    if (!req.params.id || !req.body)
      throw new HttpError(400, "Missing id or body");

    const updateOutet = await this.outletService.updateOutet(outletId, body);
    res.status(200).json({
      success: true,
      message: "Outlet updated successfully",
      data: updateOutet,
    });
  };

  deleteOutlet = async (req: Request, res: Response, next: NextFunction) => {
    const { id: outletId } = req.validated!.params as OutletIdParamDto;
    if (!req.params.id) throw new HttpError(400, "Missing id");
    const deletedOutlet = await this.outletService.deleteOutlet(outletId);
    res.status(200).json({
      success: true,
      message: "Outlet deleted successfully",
      data: deletedOutlet,
    });
  };

  idNotFound = (_req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, "Please, input a valid outlet id"));
  };
}
