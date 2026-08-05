// apps/api/src/controllers/Item.controller.ts
import ItemService from "@/services/item.services";
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import {
  CreateItemDto,
  ParamsItemDto,
  QueryItemDto,
} from "@/validations/item.validation";
import { sseService } from "@/services/sse.services";
import { PaginationDTO } from "@/validations/pagination.validation";

export class ItemController {
  private ItemService: ItemService;

  constructor(ItemService: ItemService) {
    this.ItemService = ItemService;
  }

  getAllItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.validated!.query as PaginationDTO;
      const result = await this.ItemService.getAllItems(page, limit);
      res.json({
        success: true,
        message: "Items fetched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getItemById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.validated!.params as ParamsItemDto;
      const item = await this.ItemService.getItemById(id);
      res.status(200).json({
        success: true,
        message: "Item fetched successfully",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newItem = req.validated!.body as CreateItemDto;
      const item = await this.ItemService.createItem(newItem);

      sseService.broadcast("item:updated", "item:updated");

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
      // const id = req.params.id;
      // const name = req.body;

      // get it from middleware validator
      const data = req.validated!.body as CreateItemDto;
      const id = req.validated!.params as ParamsItemDto;

      //call the service
      const editedItem = await this.ItemService.editItem(id, data);

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
      //const id = req.params.id;
      const id = req.validated!.params as ParamsItemDto;
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

  searchItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.validated!.query as QueryItemDto;
      const { page, limit } = req.validated!.query as PaginationDTO;
      if (!name) {
        throw new HttpError(400, "Please, input a valid item name");
      }
      const result = await this.ItemService.searchItem(name, page, limit);
      if (result.data.length === 0) {
        return res.status(404).json({
          success: false,
          message: `${name} not found in the database`,
        });
      }
      res.status(200).json({
        success: true,
        message: "Item searched successfully",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  idNotFound = (_req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, "Please, input a valid item id"));
  };
}
