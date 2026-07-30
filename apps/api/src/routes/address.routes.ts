import { Router } from "express";
import { AddressController } from "@/controllers/addresses.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { Validator } from "@/middleware/validate";
import { AddressValidation } from "@/validations/address.validation";
import { AddressService } from "@/services/addresses.services";

export class AddressRoute {
  public router = Router();
  private controller: AddressController;

  constructor(controller: AddressController) {
    this.controller = controller;
    this.getAddress();
    this.createAddress();
    this.setDefaultAddress();
    this.updateAddress();
    this.deleteAddress();
  }

  private getAddress() {
    this.router.get("/", authenticationMiddleware, this.controller.getAll.bind(this.controller));
  }

  private createAddress() {
    this.router.post(
      "/",
      authenticationMiddleware,
      Validator.validate({
        body: AddressValidation.CreateAddressSchema,
      }),
      this.controller.create,
    );
  }

  private updateAddress() {
    //handle if the user input no address id
    this.router.put("/", authenticationMiddleware, this.controller.idNotFound);

    this.router.put(
      "/:id",
      authenticationMiddleware,
      Validator.validate({
        body: AddressValidation.UpdateAddressSchema,
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.update,
    );
  }

  private deleteAddress() {
    //handle if the user input no address id
    this.router.delete(
      "/",
      authenticationMiddleware,
      this.controller.idNotFound,
    );

    this.router.delete(
      "/:id",
      authenticationMiddleware,
      Validator.validate({
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.delete,
    );
  }

  private setDefaultAddress() {
    //handle if the user input no address id
    this.router.put(
      "/set-default",
      authenticationMiddleware,
      this.controller.idNotFound,
    );

    this.router.put(
      "/:id/set-default",
      authenticationMiddleware,
      Validator.validate({
        params: AddressValidation.ParamsAddressSchema,
      }),
      this.controller.setDefault,
    );
  }
}

export default new AddressRoute(new AddressController(new AddressService()))
  .router;
