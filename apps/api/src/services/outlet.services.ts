// apps/api/src/services/outlet.services.ts
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import calculateDistance from "../utils/haversineDistance";
import { Prisma } from "@/generated/prisma/client";

export class OutletService {
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

  async getAll() {
    return prisma.outlet.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: {
        created_at: "desc",
      },
    });
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

  async getAllItems() {
    try {
      return await prisma.item.findMany();
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
