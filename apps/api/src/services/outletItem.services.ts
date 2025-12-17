// apps/api/src/services/outletItem.services.ts
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";
import calculateDistance from "../utils/haversineDistance";

export class OutletItemService {
  async getAll(lat: number, lng: number) {
    try {
      // fetch all the outlets first
      const outlets = await prisma.outlet.findMany();
      if (!outlets) throw new HttpError(404, "Outlet not found");

      // count the outlets distance from the user (harvesine formula)
      const result = outlets
        .map((outlet) => {
          const distance = calculateDistance(
            lat,
            lng,
            Number(outlet.lat),
            Number(outlet.lng)
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
}
