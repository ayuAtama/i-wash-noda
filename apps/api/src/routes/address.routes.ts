import { Router } from "express";
import { AddressController } from "@/controllers/addresses.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { Validator } from "@/middleware/validate";
import { AddressValidation } from "@/validations/address.validation";
import { AddressService } from "@/services/addresses.services";

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
      Validator.validate({
        body: AddressValidation.CreateAddressSchema,
      }),
      this.controller.create,
    );
  }

  private updateAddress() {
    this.router.put(
      "/addresses/:id",
      authenticationMiddleware,
      Validator.validate({
        body: AddressValidation.UpdateAddressSchema,
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.update,
    );
  }

  private deleteAddress() {
    this.router.delete(
      "/addresses/:id",
      authenticationMiddleware,
      Validator.validate({
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.delete,
    );
  }

  private setDefaultAddress() {
    this.router.post(
      "/addresses/:id/set-default",
      authenticationMiddleware,
      Validator.validate({
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.setDefault,
    );
  }
}

export default new AddressRoute().router;
