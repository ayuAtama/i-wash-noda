import { Router } from "express";
import { OutletController } from "@/controllers/outlet.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { OutletValidation } from "@/validations/outlet.validation";
import { OutletService } from "@/services/outlet.services";

export class OutletRoute {
  public router = Router();
  private controller: OutletController;

  constructor(controller: OutletController) {
    this.controller = controller;
    this.getCoveragedOutlet();
    this.getAllOutlets();
  }

  private getCoveragedOutlet() {
    this.router.get(
      "/coverage",
      Validator.validate({
        query: OutletValidation.OutletCoverageQuerySchema,
      }),
      this.controller.outletCoverage,
    );
  }

  private getAllOutlets() {
    this.router.get("/", this.controller.getAll);
  }
}

export class AdminOutletRoute {
  public router = Router();
  private controller: OutletController;

  constructor(controller: OutletController) {
    this.controller = controller;
    this.createOutlet();
    this.updateOutlet();
    this.deleteOutlet();
  }

  private createOutlet() {
    this.router.post(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        body: OutletValidation.CreateOutletSchema,
      }),
      this.controller.createOutlet,
    );
  }

  private updateOutlet() {
    // handle if the user input no outlet id
    this.router.put(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );

    this.router.put(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        params: OutletValidation.OutletIdParamSchema,
        body: OutletValidation.UpdateOutletSchema,
      }),
      this.controller.updateOutlet,
    );
  }

  private deleteOutlet() {
    // handle if the user input no outlet id
    this.router.delete(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );

    this.router.delete(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        params: OutletValidation.OutletIdParamSchema,
      }),
      this.controller.deleteOutlet,
    );
  }
}

const controller = new OutletController(new OutletService());
export const adminOutletRoutes = new AdminOutletRoute(controller).router;
export default new OutletRoute(controller).router;
