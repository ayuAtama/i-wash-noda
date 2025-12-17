import { OutletItemController } from "@/controllers/outletItem.controller";
import { Router } from "express";
import { OutletItemService } from "@/services/outletItem.services";

export class OutletItemRoute {
  public router = Router();
  private controller: OutletItemController;

  constructor() {
    this.controller = new OutletItemController(new OutletItemService());
    this.getCoveragedOutlet();
  }

  private getCoveragedOutlet() {
    this.router.get("/outlets-coverage", this.controller.outletCoverage);
  }

  private getAll() {}
}

export default new OutletItemRoute().router;
