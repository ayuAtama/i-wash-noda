import { Router } from "express";
import { ItemController } from "@/controllers/item.controller";
import ItemService from "@/services/item.services";
import { authenticationMiddleware } from "@/middleware/authentication";
import { AuthorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { ItemValidation } from "@/validations/item.validation";
import { PaginationSchema } from "@/validations/pagination.validation";

class ItemRoute {
  public router = Router();
  private controller: ItemController;

  constructor(controller: ItemController) {
    this.controller = controller;
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllItems,
    );
  }

  private searchItem() {
    this.router.get(
      "/search",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin", "outlet_admin"),
      Validator.validate({
        query: ItemValidation.QueryItemSchema.extend({
          page: PaginationSchema.shape.page,
          limit: PaginationSchema.shape.limit,
        }),
      }),
      this.controller.searchItem,
    );
  }

  private getItemById() {
    // handle if the user input no item id
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );
    this.router.get(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        params: ItemValidation.ParamsItemSchema,
      }),
      this.controller.getItemById,
    );
  }

  private createItem() {
    this.router.post(
      "/",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );
    this.router.put(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
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
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      this.controller.idNotFound,
    );
    // handle if the user input no item id
    this.router.delete(
      "/:id",
      authenticationMiddleware.handler,
      AuthorizationMiddleware.handler("super_admin"),
      Validator.validate({
        params: ItemValidation.ParamsItemSchema,
      }),
      this.controller.deleteItem,
    );
  }
}

export default new ItemRoute(new ItemController(new ItemService())).router;
