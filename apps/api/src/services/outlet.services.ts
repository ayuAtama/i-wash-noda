// apps/api/src/services/outlet.services.ts
import { prisma as defaultPrisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import { GeoUtils } from "../utils/haversineDistance";
import {
  CreateOutletDto,
  OutletCoverageQueryDto,
  OutletIdParamDto,
} from "@/validations/outlet.validation";

// 1. Extract the type directly from your working config!
type PrismaInstance = typeof defaultPrisma;

export class OutletService {
  // 2. Use the extracted type here
  private readonly prisma: PrismaInstance;

  constructor(prismaClient: PrismaInstance = defaultPrisma) {
    this.prisma = prismaClient;
  }

  public async outletCoverage(
    lat: OutletCoverageQueryDto["lat"],
    lng: OutletCoverageQueryDto["lng"],
  ) {
    try {
      const outlets = await this.prisma.outlet.findMany({
        where: { is_deleted: false },
      });

      if (!outlets) throw new HttpError(404, "Outlet not found");

      const result = outlets
        // 3. Since 'this.prisma' is now perfectly typed, TS knows what 'outlet' is!
        .map((outlet) => {
          const distance = GeoUtils.calculateDistance(
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
  public async getAll() {
    return this.prisma.outlet.findMany({
      where: { is_deleted: false },
      orderBy: { created_at: "desc" },
    });
  }

  public async createOutlet(userId: string, data: CreateOutletDto) {
    if (!userId) throw new HttpError(401, "Unauthorized");
    if (!data) throw new HttpError(400, "Bad request");

    return this.prisma.outlet.create({ data });
  }

  public async updateOutlet(
    outletId: OutletIdParamDto["id"],
    data: CreateOutletDto,
  ) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId },
    });

    if (!outlet) throw new HttpError(404, "Outlet not found");

    return this.prisma.outlet.update({
      where: {
        id: outlet.id,
        is_deleted: false,
      },
      data,
    });
  }

  public async deleteOutlet(outletId: OutletIdParamDto["id"]) {
    const outlet = await this.prisma.outlet.findUnique({
      where: { id: outletId, is_deleted: false },
    });

    if (!outlet) throw new HttpError(404, "Outlet not found");

    return this.prisma.outlet.update({
      where: {
        id: outlet.id,
        is_deleted: false,
      },
      data: { is_deleted: true },
    });
  }
}
