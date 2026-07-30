// apps/api/src/services/outletItem.services.ts
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

  async getAllItems() {
    try {
      return await this.prisma.item.findMany({
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

  async searchItem(searchItem: QueryItemDto["name"]) {
    try {
      return await this.prisma.item.findMany({
        where: {
          name: {
            contains: searchItem,
            mode: "insensitive", // case insensitive
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
