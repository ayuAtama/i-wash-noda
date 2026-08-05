// src/routes/adminMismatch.routes.ts
import { Router } from "express";
import { AdminMismatchController } from "@/controllers/adminMismatch.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { AdminMismatchValidation } from "@/validations/adminMismatch.validation";
import { AdminMissmatchServices } from "@/services/adminMissmatch.services";
import { PaginationSchema } from "@/validations/pagination.validation";

export class AdminMismatchRoute {
  public router = Router();
  private controller: AdminMismatchController;

  constructor() {
    this.controller = new AdminMismatchController(new AdminMissmatchServices());
    this.getMismatches();
    this.approve();
    this.reject();
  }

  private getMismatches() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        query: AdminMismatchValidation.MismatchQuerySchema.extend({
          page: PaginationSchema.shape.page,
          limit: PaginationSchema.shape.limit,
        }),
      }),
      this.controller.getMismatches,
    );
  }

  private approve() {
    this.router.patch(
      "/:id/approve",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: AdminMismatchValidation.MismatchIdParamsSchema,
        body: AdminMismatchValidation.ApproveMismatchSchema,
      }),
      this.controller.approve,
    );
  }

  private reject() {
    this.router.patch(
      "/:id/reject",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: AdminMismatchValidation.MismatchIdParamsSchema,
        body: AdminMismatchValidation.RejectMismatchSchema,
      }),
      this.controller.reject,
    );
  }
}

export default new AdminMismatchRoute().router;
