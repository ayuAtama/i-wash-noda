// apps/api/src/services/addresses.services.ts
import { prisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  CreateAddressDto,
  UpdateAddressDto,
  ParamsAddressDto,
  UserIdDto,
} from "@/validations/address.validation";
//type PrismaInstance = typeof defaultPrisma;

export class AddressService {
  private readonly prisma: PrismaWrapper;

  constructor(prismaClient: PrismaWrapper = prisma) {
    this.prisma = prismaClient;
  }

  async getAll(userId: string, page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        user_id: userId,
        is_deleted: false,
      };

      const [addresses, total] = await Promise.all([
        this.prisma.userAddress.findMany({
          where,
          orderBy: { created_at: "desc" },
          skip,
          take,
        }),
        this.prisma.userAddress.count({ where }),
      ]);

      return {
        data: addresses,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async create(userId: UserIdDto, data: CreateAddressDto) {
    try {
      const { label, address, lat, lng, isDefault: is_default } = data;

      const { newAddress } = await this.prisma.$transaction(async (tx) => {
        const addressCount = await tx.userAddress.count({
          where: {
            user_id: userId,
          },
        });

        const finalIsDefault = addressCount === 0 ? true : Boolean(is_default);

        if (finalIsDefault) {
          await tx.userAddress.updateMany({
            where: {
              user_id: userId,
              is_default: true,
            },
            data: {
              is_default: false,
            },
          });
        }

        const newAddress = await tx.userAddress.create({
          data: {
            user_id: userId,
            label,
            address,
            lat,
            lng,
            is_default: finalIsDefault,
          },
        });

        return { newAddress };
      });

      return newAddress;
    } catch (error) {
      throw error;
    }
  }

  async update(
    userId: UserIdDto,
    addressId: ParamsAddressDto["id"],
    data: UpdateAddressDto,
  ) {
    try {
      const { label, address, lat, lng, isDefault: is_default } = data;

      const { updatedAddress } = await this.prisma.$transaction(async (tx) => {
        if (is_default) {
          await tx.userAddress.updateMany({
            where: {
              user_id: userId,
              is_default: true,
              NOT: {
                id: addressId,
              },
            },
            data: {
              is_default: false,
            },
          });
        }

        const updatedAddress = await tx.userAddress.update({
          where: {
            id: addressId,
            user_id: userId,
          },
          data: {
            label,
            address,
            lat,
            lng,
            is_default,
          },
        });

        return { updatedAddress };
      });

      return updatedAddress;
    } catch (error) {
      throw error;
    }
  }

  async delete(userId: UserIdDto, addressId: ParamsAddressDto["id"]) {
    try {
      const deletedAddress = await this.prisma.$transaction(async (tx) => {
        const address = await tx.userAddress.findFirst({
          where: {
            id: addressId,
            user_id: userId,
            is_deleted: false,
          },
        });

        if (!address) throw new HttpError(404, "Address not found");

        const deleted = await tx.userAddress.update({
          where: {
            id: addressId,
            user_id: userId,
          },
          data: {
            is_deleted: true,
          },
        });

        if (address.is_default) {
          const oldestAddress = await tx.userAddress.findFirst({
            where: {
              user_id: userId,
              is_deleted: false,
            },
            orderBy: {
              created_at: "asc",
            },
          });

          if (oldestAddress) {
            await tx.userAddress.update({
              where: {
                id: oldestAddress.id,
              },
              data: {
                is_default: true,
              },
            });
          }
        }

        return deleted;
      });

      return deletedAddress;
    } catch (error) {
      throw error;
    }
  }

  async setDefault(userId: UserIdDto, addressId: ParamsAddressDto["id"]) {
    try {
      const defaultAddress = await this.prisma.$transaction(async (tx) => {
        const address = await tx.userAddress.findFirst({
          where: {
            id: addressId,
            user_id: userId,
          },
        });

        if (!address) throw new HttpError(404, "Address not found");

        await tx.userAddress.updateMany({
          where: {
            user_id: userId,
          },
          data: {
            is_default: false,
          },
        });

        const updated = await tx.userAddress.update({
          where: {
            id: addressId,
            user_id: userId,
          },
          data: {
            is_default: true,
          },
        });

        return updated;
      });

      return defaultAddress;
    } catch (error) {
      throw error;
    }
  }
}
