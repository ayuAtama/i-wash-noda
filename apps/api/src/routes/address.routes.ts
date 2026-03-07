import { AddressController } from "@/controllers/addresses.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AddressService } from "@/services/addresses.services";
import { Router } from "express";

export class AddressRoute {
  public router = Router();
  private controller: AddressController;

  constructor() {
    this.controller = new AddressController(new AddressService());
    this.getAddress();
    this.createAddress();
    this.updateAddress();
    this.deleteAddress();
    this.setDefaultAddress();
  }

  private getAddress() {
    this.router.get(
      "/addresses",
      authenticationMiddleware,
      this.controller.getAll,
    );
  }

  private createAddress() {
    this.router.post(
      "/addresses",
      authenticationMiddleware,
      this.controller.create,
    );
  }

  private updateAddress() {
    this.router.put(
      "/addresses/:id",
      authenticationMiddleware,
      this.controller.update,
    );
  }

  private deleteAddress() {
    this.router.delete(
      "/addresses/:id",
      authenticationMiddleware,
      this.controller.delete,
    );
  }

  private setDefaultAddress() {
    this.router.post(
      "/addresses/:id/set-default",
      authenticationMiddleware,
      this.controller.setDefault,
    );
  }
}

export default new AddressRoute().router;
