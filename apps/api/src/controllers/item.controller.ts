// apps/api/src/controllers/Item.controller.ts
import ItemService from "@/services/item.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreateOutletDto,
  OutletIdParamDto,
} from "@/validations/outlet.validation";

export class ItemController {
  private ItemService: ItemService;

  constructor(ItemService: ItemService) {
    this.ItemService = ItemService;
  }

  getAllItems = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await this.ItemService.getAllItems();
      res.json({
        success: true,
        message: "Items fetched successfully",
        data: items,
      });
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.ItemService.createItem({
        name: req.body.name,
      });
      res.status(201).json({
        success: true,
        message: "Item created successfully",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the item id and name from controller
      const id = req.params.id;
      const name = req.body;

      //call the service
      const editedItem = await this.ItemService.editItem(id, name);

      //response
      res.status(200).json({
        success: true,
        message: "Item edited successfully",
        data: editedItem,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id;
      const deletedItem = await this.ItemService.deleteItem(id);
      res.status(200).json({
        success: true,
        message: "Item deleted successfully",
        data: deletedItem,
      });
    } catch (error) {
      next(error);
    }
  };

  idNotFound = (_req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, "Please, input a valid item id"));
  };
}
