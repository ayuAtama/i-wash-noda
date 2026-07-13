// src/controllers/adminMismatch.controller.ts
import { AdminMissmatchServices } from "@/services/adminMissmatch.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  MismatchIdParamsDto,
  MismatchQueryDto,
  ApproveMismatchDto,
  RejectMismatchDto,
} from "@/validations/adminMismatch.validation";
import { PaginationDTO } from "@/validations/pagination.validation";

export class AdminMismatchController {
  private service: AdminMissmatchServices;

  constructor(service: AdminMissmatchServices) {
    this.service = service;
  }

  getMismatches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const outletId = req.context?.outlet_id;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const { station } = (req.validated?.query ?? {}) as MismatchQueryDto;
      const { page, limit } = req.validated!.query as PaginationDTO;

      const result = await this.service.getMismatches(
        userId,
        outletId,
        station,
        page,
        limit,
      );

      res.status(200).json({
        success: true,
        message: "Mismatches fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const outletId = req.context?.outlet_id;
      const { id } = req.validated!.params as MismatchIdParamsDto;
      const { acceptedQuantity } = req.validated!.body as ApproveMismatchDto;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const data = await this.service.approveMismatch(
        id,
        userId,
        outletId,
        acceptedQuantity,
      );

      res.status(200).json({
        success: true,
        message: "Mismatch approved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.access_token?.sub ?? req.user?.id;
      const outletId = req.context?.outlet_id;
      const { id } = req.validated!.params as MismatchIdParamsDto;
      const { note } = req.validated!.body as RejectMismatchDto;
      if (!userId) throw new HttpError(401, "Unauthorized");
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      const data = await this.service.rejectMismatch(
        id,
        userId,
        outletId,
        note,
      );

      res.status(200).json({
        success: true,
        message: "Mismatch rejected",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}
