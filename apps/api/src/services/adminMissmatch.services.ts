// src/services/adminMissmatch.services.ts
import { prisma } from "@/config/prisma";
import { StationName } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";

export class AdminMissmatchServices {
  async getMismatches(
    userId: string,
    outletId: string,
    station?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { outlet_id } = await prisma.user.findFirstOrThrow({
        where: { id: userId },
        select: { outlet_id: true },
      });

      if (outlet_id !== outletId) {
        throw new HttpError(401, "Unauthorized");
      }

      const where: any = {
        status: "pending",
        order: { outlet_id: outletId },
      };

      if (station) {
        where.station = station as StationName;
      }

      const { skip, take } = { skip: (page - 1) * limit, take: limit };

      const [missmatchData, total] = await Promise.all([
        prisma.orderStationLog.findMany({
          where,
          select: {
            id: true,
            item_id: true,
            station: true,
            quantity_input: true,
            created_at: true,
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
            item: {
              select: {
                id: true,
                name: true,
              },
            },
            worker: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          skip,
          take,
        }),
        prisma.orderStationLog.count({ where }),
      ]);

      return {
        data: missmatchData,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async approveMismatch(
    logId: string,
    adminId: string,
    outletId: string,
    acceptedQuantity: number,
  ) {
    try {
      const { outlet_id } = await prisma.user.findFirstOrThrow({
        where: { id: adminId },
        select: { outlet_id: true },
      });

      if (outlet_id !== outletId) {
        throw new HttpError(401, "Unauthorized");
      }

      const log = await prisma.orderStationLog.findUnique({
        where: { id: logId },
        select: {
          id: true,
          order_id: true,
          item_id: true,
          station: true,
          status: true,
        },
      });

      if (!log) throw new HttpError(404, "Mismatch log not found");
      if (log.status !== "pending") {
        throw new HttpError(400, "This mismatch is already resolved");
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedLog = await tx.orderStationLog.update({
          where: { id: logId },
          data: {
            status: "approved",
            approved_by: adminId,
            approved_at: new Date(),
            quantity_input: acceptedQuantity,
          },
        });

        const existingSummary = await tx.stationSummary.findUnique({
          where: {
            order_id_item_id_station: {
              order_id: log.order_id,
              item_id: log.item_id,
              station: log.station,
            },
          },
        });

        if (existingSummary) {
          await tx.stationSummary.update({
            where: { id: existingSummary.id },
            data: {
              latest_quantity: acceptedQuantity,
              updated_at: new Date(),
            },
          });
        } else {
          await tx.stationSummary.create({
            data: {
              order_id: log.order_id,
              item_id: log.item_id,
              station: log.station,
              latest_quantity: acceptedQuantity,
            },
          });
        }

        return updatedLog;
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async rejectMismatch(
    logId: string,
    adminId: string,
    outletId: string,
    note: string,
  ) {
    try {
      const { outlet_id } = await prisma.user.findFirstOrThrow({
        where: { id: adminId },
        select: { outlet_id: true },
      });

      if (outlet_id !== outletId) {
        throw new HttpError(401, "Unauthorized");
      }

      const log = await prisma.orderStationLog.findUnique({
        where: { id: logId },
        select: { id: true, status: true },
      });

      if (!log) throw new HttpError(404, "Mismatch log not found");
      if (log.status !== "pending") {
        throw new HttpError(400, "This mismatch is already resolved");
      }

      const updatedLog = await prisma.orderStationLog.update({
        where: { id: logId },
        data: {
          status: "rejected",
          approved_by: adminId,
          approved_at: new Date(),
          admin_note: note,
        },
      });

      return updatedLog;
    } catch (error) {
      throw error;
    }
  }
}
