// apps/api/src/services/outletItem.services.ts
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import { Prisma } from "@/generated/prisma/client";

export default class ItemService {
  async getAllItems() {
    try {
      return await prisma.item.findMany();
    } catch (error) {
      throw error;
    }
  }

  async getItemById(itemId: string) {
    try {
      return await prisma.item.findUnique({
        where: { id: itemId },
      });
    } catch (error) {
      throw error;
    }
  }

  async createItem(data: Prisma.ItemCreateInput) {
    try {
      return await prisma.item.create({ data });
    } catch (error) {
      throw error;
    }
  }

  editItem = async (itemId: string, data: Prisma.ItemUpdateInput) => {
    try {
      return await prisma.item.update({
        where: { id: itemId },
        data,
      });
    } catch (error) {
      throw error;
    }
  };

  deleteItem = async (itemId: string) => {
    try {
      return await prisma.item.delete({
        where: { id: itemId },
      });
    } catch (error) {
      throw error;
    }
  };
}
