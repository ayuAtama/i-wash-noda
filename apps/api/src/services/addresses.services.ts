// apps/api/src/services/addresses.services.ts
import { prisma } from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";

export class AddressService {
  async getAll(userId: string) {
    try {
      // get the addresses
      const addresses = await prisma.userAddress.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return addresses;
    } catch (error) {
      throw error;
    }
  }

  async create(data: Prisma.UserAddressUncheckedCreateInput) {
    try {
      // get the data
      const { label, address, lat, lng, is_default, user_id: userId } = data;

      // create the address
      const { newAddress } = await prisma.$transaction(async (tx) => {
        // check if user already has any address
        const addressCount = await tx.userAddress.count({
          where: {
            user_id: userId,
          },
        });

        // if this is the first one, make it is_default true
        const finalIsDefault = addressCount === 0 ? true : Boolean(is_default);

        // check if the address is_default true
        if (finalIsDefault) {
          // change the previous is_default address' into false
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

        // and just store it immediately
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
    userId: string,
    addressId: string,
    data: Prisma.UserAddressUpdateInput,
  ) {
    try {
      // get the data
      const { label, address, lat, lng, is_default } = data;

      // update the address
      const { updatedAddress } = await prisma.$transaction(async (tx) => {
        // check if the address is_default
        if (is_default) {
          // change the previous is_default address' into false
          await tx.userAddress.updateMany({
            where: {
              user_id: userId,
              is_default: true,
              NOT: {
                id: addressId, // exclude own adress
              },
            },
            data: {
              is_default: false,
            },
          });
        }

        // and just update it cassually
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

  async delete(userId: string, addressId: string) {
    try {
      const deletedAddress = await prisma.$transaction(async (tx) => {
        // find the address first to know if it was default
        const address = await tx.userAddress.findFirst({
          where: {
            id: addressId,
            user_id: userId,
          },
        });

        if (!address) throw new HttpError(404, "Address not found");

        // delete the address
        const deleted = await tx.userAddress.delete({
          where: {
            id: addressId,
            user_id: userId,
          },
        });

        // if deleted address was default, promote another one
        if (address.is_default) {
          // choose the OLDEST address (created earliest)
          const oldestAddress = await tx.userAddress.findFirst({
            where: {
              user_id: userId,
            },
            orderBy: {
              created_at: "asc",
            },
          });

          // if no address remains, do nothing
          // having zero addresses is a valid state
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

  async setDefault(userId: string, addressId: string) {
    try {
      // do it in transaction
      const defaultAddress = await prisma.$transaction(async (tx) => {
        // find the address first to know if it was default
        const address = await tx.userAddress.findFirst({
          where: {
            id: addressId,
            user_id: userId,
          },
        });

        if (!address) throw new HttpError(404, "Address not found");

        // change all address to !is_default
        await tx.userAddress.updateMany({
          where: {
            user_id: userId,
          },
          data: {
            is_default: false,
          },
        });

        // update the address
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
