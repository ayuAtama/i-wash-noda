// src/services/adminMissmatch.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";

export class AdminMissmatchServices {
  // get the list of all missmatch data from the outlet
  async getMissmatchData(userId: string, outletId: string) {
    try {
      // confirm the match outlet
      const { outlet_id } = await prisma.user.findFirstOrThrow({
        where: { id: userId },
        select: { outlet_id: true },
      });

      if (outlet_id !== outletId) {
        throw new HttpError(401, "Unauthorized");
      }

      // fetch the missmatch data
      const missmatchData = await prisma.orderStationLog.findMany({
        where: {
          station: "washing",
          status: "pending",
          order: {
            outlet_id: outletId,
          },
        },
        select: {
          id: true,
          item_id: true,
          quantity_input: true,
          created_at: true,
          // order
          order: {
            select: {
              id: true,
              items: {
                select: {
                  item_id: true,
                  quantity_initial: true,
                },
              },
            },
          },
          // item
          item: {
            select: {
              id: true,
              name: true,
            },
          },
          // worker
          worker: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
