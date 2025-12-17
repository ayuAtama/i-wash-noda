import { OutletItemController } from "@/controllers/outletItem.controller";
import { Router } from "express";
import { OutletItemService } from "@/services/outletItem.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";

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
      this.controller.createOutlet
    );
  }

  private updateOutlet() {
    this.router.put(
      "/outlets/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.updateOutlet
    );
  }

  private deleteOutlet() {
    this.router.delete(
      "/outlets/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.deleteOutlet
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
      this.controller.createItem
    );
  }
}

export default new OutletItemRoute().router;
