// src/services/adminMissmatch.services.ts
import { prisma } from "@/config/prisma";
import { MismatchStatus, StationName } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";
import {
  DetailMismatchDataParamsDTO,
  FetchAllMismatchPayload,
  FetchDetailMismatchPayload,
  ManageMismatchPayload,
  manageMismatchPayloadDTO,
  ManageMismatchSchemaDTO,
} from "@/validations/adminMismatch.validation";

export class AdminMissmatchServices {
  // get the list of all missmatch data from the outlet
  async getMissmatchID(payload: FetchAllMismatchPayload) {
    try {
      const { outletId, stationName } = payload;
      if (!outletId) throw new HttpError(401, "Outlet id not found");

      // fetch the missmatch data
      const missmatch = await prisma.orderStationLog.findMany({
        where: {
          status: "pending",
          order: {
            outlet_id: outletId,
          },
          station: stationName ?? {},
        },
        distinct: ["order_id", "station"],
        select: {
          order_id: true,
          station: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return {
        success: true,
        message: "Missmatch data fetched successfully",
        data: missmatch,
      };
    } catch (error) {
      throw error;
    }
  }

  getDetailMismatchData = async (payload: FetchDetailMismatchPayload) => {
    try {
      const { outletId, orderId, stationName } = payload;

      const mismatch = await prisma.orderStationLog.findMany({
        where: {
          order_id: orderId,
          order: {
            outlet_id: outletId,
          },
          status: "pending",
          station: stationName,
        },
        select: {
          item_id: true,
          quantity_input: true,
          admin_note: true,
          station: true,
          item: {
            select: {
              name: true,
            },
          },
        },
      });

      if (mismatch.length === 0) {
        throw new HttpError(404, "No mismatch data found");
      }

      let formattedActualItems = [];
      if (stationName === StationName.washing) {
        const actualItem = await prisma.orderItem.findMany({
          where: {
            order_id: orderId,
            order: {
              outlet_id: outletId,
            },
          },
          select: {
            item_id: true,
            quantity_initial: true,
          },
        });

        formattedActualItems = actualItem.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity_initial,
        }));
      } else {
        let stationBefore: StationName;
        if (stationName === StationName.ironing) {
          stationBefore = StationName.washing;
        } else if (stationName === StationName.packing) {
          stationBefore = StationName.ironing;
        } else {
          throw new HttpError(
            400,
            "Invalid station name for fetching previous station summary",
          );
        }
        const actualItem = await prisma.stationSummary.findMany({
          where: {
            order_id: orderId,
            order: {
              outlet_id: outletId,
            },
            station: stationBefore,
          },
          select: {
            item_id: true,
            latest_quantity: true,
          },
        });

        formattedActualItems = actualItem.map((item) => ({
          item_id: item.item_id,
          quantity: item.latest_quantity,
        }));
      }
      return {
        success: true,
        message: "Missmatch data fetched successfully",
        data: { mismatch, formattedActualItems },
      };
    } catch (error) {
      throw error;
    }
  };

  manageMismatch = async (payload: ManageMismatchPayload) => {
    try {
      const { orderId, stationName, adminId, outletId, summary, mismatch } =
        payload;

      //guard rail
      const isExist = await prisma.stationSummary.findFirst({
        where: {
          order_id: orderId,
          station: stationName,
          order: {
            outlet_id: outletId,
          },
        },
      });
      if (isExist) {
        throw new HttpError(
          400,
          "You have managed the mismatch data or it already accepted automatically",
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const mismatchData = await Promise.all(
          mismatch.map(async (item) => {
            const mismatchUpdate = await tx.orderStationLog.updateManyAndReturn(
              {
                where: {
                  order_id: orderId,
                  station: stationName,
                  item_id: item.itemId,
                },
                data: {
                  status: item.status as MismatchStatus,
                  admin_note: item.adminNote,
                  approved_by: adminId,
                  approved_at: new Date(),
                },
              },
            );
            return mismatchUpdate;
          }),
        );

        const summaryData = await Promise.all(
          summary.map(async (item) => {
            const summaryUpdate = await tx.stationSummary.createManyAndReturn({
              data: {
                order_id: orderId,
                item_id: item.itemId,
                latest_quantity: item.latestQuantity,
                station: stationName,
              },
            });
            return summaryUpdate;
          }),
        );

        return { mismatchData, summaryData };
      });

      return {
        success: true,
        message: "Missmatch data updated successfully",
        data: result,
      };
    } catch (error) {
      throw error;
    }
  };
}
