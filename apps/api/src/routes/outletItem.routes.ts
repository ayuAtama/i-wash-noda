import { Router } from "express";
import { OutletItemController } from "@/controllers/outletItem.controller";
import { OutletItemService } from "@/services/outletItem.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { OutletValidation } from "@/validations/outlet.validation";

export class OutletItemRoute {
  public router = Router();
  private controller: OutletItemController;

  constructor(controller: OutletItemController) {
    this.controller = controller;
    this.getCoveragedOutlet();
    this.getAllOutlets();
    this.createOutlet();
    this.updateOutlet();
    this.deleteOutlet();
    this.getAllItems();
    this.createItem();
  }

  private getCoveragedOutlet() {
    this.router.get("/outlets-coverage", this.controller.outletCoverage);
  }

  private getAllOutlets() {
    this.router.get("/outlets", this.controller.getAll);
  }

  private createOutlet() {
    this.router.post(
      "/outlets",
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
      "/outlets",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );

    this.router.put(
      "/outlets/:id",
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
      "/outlets",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );

    this.router.delete(
      "/outlets/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        params: OutletValidation.OutletIdParamSchema,
      }),
      this.controller.deleteOutlet,
    );
  }

  private getAllItems() {
    this.router.get("/items", this.controller.getAllItems);
  }

  private createItem() {
    this.router.post(
      "/items",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        //body: OutletValidation.CreateItemSchema,
      }),
      this.controller.createItem,
    );
  }
}

export default new OutletItemRoute(
  new OutletItemController(new OutletItemService()),
).router;
