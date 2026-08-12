// apps/api/src/controllers/setup.controller.ts
import type { Request, Response, NextFunction } from "express";
import { SetupService } from "@/services/setup.services";
import { SetupSuperAdminDto } from "@/validations/setup.validation";

export class SetupController {
  private setupService: SetupService;

  constructor(setupService: SetupService) {
    this.setupService = setupService;
  }

  getSetupStatus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const setupRequired = await this.setupService.isSetupNeeded();
      if (!setupRequired) {
        return res.status(409).json({
          success: false,
          message: "Super admin already exists",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Setup required",
        data: { setupRequired },
      });
    } catch (error) {
      next(error);
    }
  };

  createSuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const payload = req.validated!.body as SetupSuperAdminDto;
      const result = await this.setupService.createSuperAdmin(payload);
      return res.status(201).json({
        success: true,
        message: "Super admin created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
