import { Router } from "express";
import AdminMissmatchController from "@/controllers/adminMismatch.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { resolveContext } from "@/middleware/resolveContext";
import { Validator } from "@/middleware/validate";
import { AdminMismatchValidation } from "@/validations/adminMismatch.validation";
import { AdminMissmatchServices } from "@/services/adminMissmatch.services";

export class AdminMissmatchRoute {
  public router = Router();
  private controller: AdminMissmatchController;

  constructor(controller: AdminMissmatchController) {
    this.controller = controller;
    this.getMissmatchID();
    this.getDetailMismatchData();
    this.manageMismatch();
  }

  private getMissmatchID() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        query: AdminMismatchValidation.QueryValidation,
      }),
      this.controller.getMissmatchID,
    );
  }

  private getDetailMismatchData() {
    this.router.get(
      "/:orderId/:stationName",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: AdminMismatchValidation.DetailMismatchDataParams,
      }),
      this.controller.getDetailMismatchData,
    );
  }

  private manageMismatch() {
    this.router.put(
      "/:orderId/:stationName",
      authenticationMiddleware,
      authorizationMiddleware("outlet_admin"),
      resolveContext,
      Validator.validate({
        params: AdminMismatchValidation.OrderIdStationNameParams,
        body: AdminMismatchValidation.ManageMismatchSchema,
      }),
      this.controller.manageMismatch,
    );
  }
}

export default new AdminMissmatchRoute(
  new AdminMissmatchController(new AdminMissmatchServices()),
).router;
