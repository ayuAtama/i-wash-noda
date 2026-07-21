import { AdminMissmatchServices } from "@/services/adminMissmatch.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  DetailMismatchDataParamsDTO,
  ManageMismatchSchemaDTO,
  OrderIdStationNameParamsDTO,
  ParamsValidationDTO,
  QueryValidationDTO,
} from "@/validations/adminMismatch.validation";

export class AdminMissmatchController {
  private adminMissmatchServices: AdminMissmatchServices;

  constructor(adminMissmatchServices: AdminMissmatchServices) {
    this.adminMissmatchServices = adminMissmatchServices;
  }

  getMissmatchID = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.context;
      if (!context)
        throw new HttpError(
          401,
          "Context not found or perhaps forget to use the resolveContext middlewere",
        );
      const { outlet_id: outletId } = context;

      const query = req.validated!.query as QueryValidationDTO;
      const payload = {
        ...query,
        outletId,
      };

      const data = await this.adminMissmatchServices.getMissmatchID(payload);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  getDetailMismatchData = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { orderId, stationName } = req.validated!
        .params as DetailMismatchDataParamsDTO;

      if (!req.context)
        throw new HttpError(
          500,
          "The Developer forgot to add the context middleware",
        );

      const { outlet_id: outletId } = req.context;

      const payload = {
        orderId,
        outletId,
        stationName,
      };

      const mismatchData =
        await this.adminMissmatchServices.getDetailMismatchData(payload);

      res.status(200).json(mismatchData);
    } catch (err) {
      next(err);
    }
  };

  manageMismatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.access_token) throw new HttpError(401, "Please login first");
      const { sub: adminId } = req.access_token;
      if (!adminId) throw new HttpError(401, "Please login first");
      if (!req.context)
        throw new HttpError(
          500,
          "The Developer forgot to add the context middleware",
        );
      const { outlet_id: outletId } = req.context!;
      if (!outletId) throw new HttpError(401, "Please login first");

      // console.log(req.validated);
      const { orderId, stationName } = req.validated!
        .params as OrderIdStationNameParamsDTO;
      const body = req.validated!.body as ManageMismatchSchemaDTO;

      // direct
      // const { orderId, stationName } = req.params;
      // const body = req.body;

      const payload = {
        ...body,
        adminId,
        orderId,
        stationName,
        outletId,
      };

      const data = await this.adminMissmatchServices.manageMismatch(payload);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
}

export default AdminMissmatchController;
