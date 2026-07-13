// apps/api/src/services/outletItem.services.ts
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import calculateDistance from "../utils/haversineDistance";
import { Prisma } from "@/generated/prisma/client";

export class OutletItemService {
  async outletCoverage(lat: number, lng: number) {
    try {
      // fetch all the outlets first
      const outlets = await prisma.outlet.findMany({
        where: {
          is_deleted: false,
        },
      });
      if (!outlets) throw new HttpError(404, "Outlet not found");

      // count the outlets distance from the user (harvesine formula)
      const result = outlets
        .map((outlet) => {
          const distance = calculateDistance(
            lat,
            lng,
            Number(outlet.lat),
            Number(outlet.lng),
          );

          // return the distance and mutate it into the outlet
          return {
            ...outlet,
            distance_km: Number(distance.toFixed(2)),
            within_coverage: distance <= Number(outlet.max_distance_km),
          };
        })
        .filter((outlet) => outlet.within_coverage); // eliminate the outlets that are not within coverage

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAll(page: number = 1, limit: number = 10) {
    const { skip, take } = { skip: (page - 1) * limit, take: limit };
    const where = { is_deleted: false };
    const [outlets, total] = await Promise.all([
      prisma.outlet.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take,
      }),
      prisma.outlet.count({ where }),
    ]);
    return {
      data: outlets,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createOutlet(userId: string, data: Prisma.OutletCreateInput) {
    if (!userId) throw new HttpError(401, "Unauthorized");
    if (!data) throw new HttpError(400, "Bad request");
    return prisma.outlet.create({ data });
  }

  async updateOutet(outletId: string, data: Prisma.OutletUpdateInput) {
    // get the outlet by id
    const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
    if (!outlet) throw new HttpError(404, "Outlet not found");

    // update the outlet
    const updatedOutlet = await prisma.outlet.update({
      where: {
        id: outlet.id,
        is_deleted: false,
      },
      data,
    });

    return updatedOutlet;
  }

  async deleteOutlet(outletId: string) {
    const outlet = await prisma.outlet.findUnique({
      where: { id: outletId, is_deleted: false },
    });
    if (!outlet) throw new HttpError(404, "Outlet not found");

    return prisma.outlet.update({
      where: {
        id: outlet.id,
        is_deleted: false,
      },
      data: {
        is_deleted: true,
      },
    });
  }

  async getAllItems(page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {};
      const [items, total] = await Promise.all([
        prisma.item.findMany({ skip, take }),
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

  async createItem(data: Prisma.ItemCreateInput) {
    try {
      return await prisma.item.create({ data });
    } catch (error) {
      throw error;
    }
  }
}
