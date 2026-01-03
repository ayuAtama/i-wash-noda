// src/services/pickupRequest.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";

export class PickupRequest {
  async createPickupRequest(userId: string, data: any) {
    if (!userId) throw new HttpError(401, "Unauthorized");
    if (!data) throw new HttpError(400, "Bad request");
    return prisma.pickupRequest.create({ data });
  }
}
