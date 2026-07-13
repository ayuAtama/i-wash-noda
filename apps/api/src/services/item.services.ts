// apps/api/src/services/outletItem.services.ts
import {
  CreateItemDto,
  ParamsItemDto,
  QueryItemDto,
  UpdateItemDto,
} from "@/validations/item.validation";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import { Prisma } from "@/generated/prisma/client";

export default class ItemService {
  async getAllItems(page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {};
      const [items, total] = await Promise.all([
        prisma.item.findMany({
          orderBy: { created_at: "desc" },
          skip,
          take,
        }),
        prisma.item.count({ where }),
      ]);
      return {
        data: items,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
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

  searchItem = async (
    searchItem: QueryItemDto["name"],
    page: number = 1,
    limit: number = 10,
  ) => {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        name: {
          contains: searchItem,
          mode: "insensitive" as const,
        },
      };
      const [items, total] = await Promise.all([
        prisma.item.findMany({ where, skip, take }),
        prisma.item.count({ where }),
      ]);
      return {
        data: items,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  };
}
