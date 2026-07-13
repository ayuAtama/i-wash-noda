import { Router } from "express";
import { ItemController } from "@/controllers/item.controller";
import ItemService from "@/services/item.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { ItemValidation } from "@/validations/item.validation";

class ItemRoute {
  public router = Router();
  private controller: ItemController;

  constructor() {
    this.controller = new ItemController(new ItemService());
    this.searchItem();
    this.getAllItems();
    this.getItemById();
    this.createItem();
    this.updateItem();
    this.deleteItem();
  }

  private getAllItems() {
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      this.controller.getAllItems,
    );
  }

  private searchItem() {
    this.router.get(
      "/search",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      Validator.validate({
        query: ItemValidation.QueryItemSchema,
      }),
      this.controller.searchItem,
    );
  }

  private getItemById() {
    // handle if the user input no item id
    this.router.get(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );
    this.router.get(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      Validator.validate({
        params: ItemValidation.ParamsItemSchema,
      }),
      this.controller.getItemById,
    );
  }

  private createItem() {
    this.router.post(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      Validator.validate({
        body: ItemValidation.CreateItemSchema,
      }),
      this.controller.createItem,
    );
  }

  private updateItem() {
    // handle if the user input no item id
    this.router.put(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );
    this.router.put(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      Validator.validate({
        params: ItemValidation.ParamsItemSchema,
        body: ItemValidation.UpdateItemSchema,
      }),
      this.controller.updateItem,
    );
  }

  private deleteItem() {
    // handle if the user input no item id
    this.router.delete(
      "/",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );
    // handle if the user input no item id
    this.router.delete(
      "/:id",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      Validator.validate({
        params: ItemValidation.ParamsItemSchema,
      }),
      this.controller.deleteItem,
    );
  }
}

export default new ItemRoute().router;
