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
    this.getAllItems();
    this.getItemById();
    this.createItem();
    this.updateItem();
    this.deleteItem();
  }

  private getAllItems() {
    this.router.get("/items", this.controller.getAllItems);
  }

  private getItemById() {
    // handle if the user not input item id
    this.router.get("/items");
    this.router.get(
      "/items/:id",
      Validator.validate({
        params: ItemValidation.ParamsItemSchema,
      }),
      this.controller.getItemById,
    );
  }

  private createItem() {
    this.router.post(
      "/items",
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
      "/items",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );
    this.router.put(
      "/items/:id",
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
      "/items",
      authenticationMiddleware,
      authorizationMiddleware("super_admin"),
      this.controller.idNotFound,
    );
    // handle if the user input no item id
    this.router.delete(
      "/items/:id",
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
