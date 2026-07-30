// apps/api/src/services/outletItem.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import calculateDistance from "@/utils/haversineDistance";
import {
  CreateOutletDto,
  UpdateOutletDto,
  OutletIdParamDto,
  OutletCoverageQueryDto,
  UserIdDto,
} from "@/validations/outlet.validation";
import { CreateItemDto } from "@/validations/item.validation";

export class OutletItemService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async outletCoverage(
    lat: OutletCoverageQueryDto["lat"],
    lng: OutletCoverageQueryDto["lng"],
  ) {
    try {
      const outlets = await this.prisma.outlet.findMany({
        where: {
          is_deleted: false,
        },
      });
      if (!outlets) throw new HttpError(404, "Outlet not found");

      const result = outlets
        .map((outlet) => {
          const distance = calculateDistance(
            lat,
            lng,
            Number(outlet.lat),
            Number(outlet.lng),
          );

          return {
            ...outlet,
            distance_km: Number(distance.toFixed(2)),
            within_coverage: distance <= Number(outlet.max_distance_km),
          };
        })
        .filter((outlet) => outlet.within_coverage);

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getAll() {
    return this.prisma.outlet.findMany({
      where: {
        is_deleted: false,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async createOutlet(userId: UserIdDto, data: CreateOutletDto) {
    if (!userId) throw new HttpError(401, "Unauthorized");
    if (!data) throw new HttpError(400, "Bad request");
    return this.prisma.outlet.create({ data });
  }

  async updateOutet(outletId: OutletIdParamDto["id"], data: UpdateOutletDto) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
    });
    if (!outlet) throw new HttpError(404, "Outlet not found");

    const updatedOutlet = await this.prisma.outlet.update({
      where: {
        id: outlet.id,
        is_deleted: false,
      },
      data,
    });

    return updatedOutlet;
  }

  async deleteOutlet(outletId: OutletIdParamDto["id"]) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId, is_deleted: false },
    });
    if (!outlet) throw new HttpError(404, "Outlet not found");

    return this.prisma.outlet.update({
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
      return await this.prisma.item.findMany();
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
}
