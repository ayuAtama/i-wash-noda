// src/routes/setup.routes.ts
import { Router } from "express";
import { SetupController } from "@/controllers/setup.controller";
import { SetupService } from "@/services/setup.services";
import { PrismaWrapper } from "@/config/prisma";
import { RateLimiter } from "@/middleware/rateLimitter";
import { Validator } from "@/middleware/validate";
import { SetupValidation } from "@/validations/setup.validation";

export class SetupRoute {
  public router = Router();
  private controller: SetupController;

  constructor(controller: SetupController) {
    this.controller = controller;
    this.setupStatus();
    this.createSuperAdmin();
  }

  private setupStatus() {
    this.router.get("/", this.controller.getSetupStatus);
  }

  private createSuperAdmin() {
    this.router.post(
      "/",
      RateLimiter.create(5),
      Validator.validate({
        body: SetupValidation.SetupSuperAdminSchema,
      }),
      this.controller.createSuperAdmin,
    );
  }
}

export default new SetupRoute(
  new SetupController(new SetupService(new PrismaWrapper())),
).router;
