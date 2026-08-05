// apps/api/src/services/item.services.ts
import {
  CreateItemDto,
  ParamsItemDto,
  QueryItemDto,
  UpdateItemDto,
} from "@/validations/item.validation";
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "../utils/httpError";

export default class ItemService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async getAllItems(page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {};
      const [items, total] = await Promise.all([
        this.prisma.item.findMany({
          orderBy: { created_at: "desc" },
          skip,
          take,
        }),
        this.prisma.item.count({ where }),
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
      return await this.prisma.item.findUnique({
        where: itemId,
      });
    } catch (error) {
      throw error;
    }
  }

  async createItem(data: CreateItemDto) {
    try {
      return await this.prisma.item.create({ data });
    } catch (error) {
      throw error;
    }
  }

  async editItem(itemId: ParamsItemDto, data: UpdateItemDto) {
    try {
      return await this.prisma.item.update({
        where: itemId,
        data,
      });
    } catch (error) {
      throw error;
    }
  }

  async deleteItem(itemId: ParamsItemDto) {
    try {
      return await this.prisma.item.delete({
        where: itemId,
      });
    } catch (error) {
      throw error;
    }
  }

  async searchItem(searchItem: QueryItemDto["name"], page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        name: {
          contains: searchItem,
          mode: "insensitive" as const,
        },
      };
      const [items, total] = await Promise.all([
        this.prisma.item.findMany({ where, skip, take }),
        this.prisma.item.count({ where }),
      ]);
      return {
        data: items,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }
}
