// apps/api/src/services/outletItem.services.ts
import {
  CreateItemDto,
  ParamsItemDto,
  UpdateItemDto,
} from "@/validations/item.validation";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import { Prisma } from "@/generated/prisma/client";

export default class ItemService {
  async getAllItems() {
    try {
      return await prisma.item.findMany({
        orderBy: {
          created_at: "desc",
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getItemById(itemId: ParamsItemDto) {
    try {
      return await prisma.item.findUnique({
        where: itemId,
      });
    } catch (error) {
      throw error;
    }
  }

  async createItem(data: CreateItemDto) {
    try {
      return await prisma.item.create({ data });
    } catch (error) {
      throw error;
    }
  }

  editItem = async (itemId: ParamsItemDto, data: UpdateItemDto) => {
    try {
      return await prisma.item.update({
        where: itemId,
        data,
      });
    } catch (error) {
      throw error;
    }
  };

  deleteItem = async (itemId: ParamsItemDto) => {
    try {
      return await prisma.item.delete({
        where: itemId,
      });
    } catch (error) {
      throw error;
    }
  };
}
