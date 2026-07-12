import { Router } from "express";
import { OutletItemController } from "@/controllers/outletItem.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { OutletValidation } from "@/validations/outlet.validation";
import { OutletItemService } from "@/services/outletItem.services";

export class OutletItemRoute {
  public router = Router();
  private controller: OutletItemController;

  constructor() {
    this.controller = new OutletItemController(new OutletItemService());
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
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
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
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );

    this.router.put(
      "/outlets/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
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
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );

    this.router.delete(
      "/outlets/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
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
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      Validator.validate({
        //body: OutletValidation.CreateItemSchema,
      }),
      this.controller.createItem,
    );
  }
}

export default new OutletItemRoute().router;
