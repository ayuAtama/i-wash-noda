// apps/api/src/routes/itemPublic.routes.ts

import { Router } from "express";
import { authenticationMiddleware } from "@/middleware/authentication";
import { Validator } from "@/middleware/validate";
import { ItemValidation } from "@/validations/item.validation";
import ItemService from "@/services/item.services";

class ItemPublicRoute {
  public router = Router();
  private itemService: ItemService;

  constructor(itemService: ItemService) {
    this.itemService = itemService;
    this.searchItem();
  }

  // Authenticated item search (any logged-in role, e.g. worker re-input).
  private searchItem() {
    this.router.get(
      "/search",
      authenticationMiddleware,
      Validator.validate({
        query: ItemValidation.QueryItemSchema,
      }),
      async (req, res, next) => {
        try {
          const { name } = req.validated!.query as { name: string };
          const items = await this.itemService.searchItem(name);
          res.status(200).json({
            success: true,
            message: "Item searched successfully",
            data: items,
          });
        } catch (error) {
          next(error);
        }
      },
    );
  }
}

export default new ItemPublicRoute(new ItemService()).router;
