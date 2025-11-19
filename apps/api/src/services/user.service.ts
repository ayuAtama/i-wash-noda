// apps/api/src/services/user.service.ts
import { prisma } from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";
import type {
  CreateUserDto,
  UpdateUserDto,
} from "../validations/user.validation";

export class UserService {
  async getAll() {
    return prisma.user.findMany();
  }

  async getById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto) {
    return prisma.user.create({ data });
  }

  async update(id: number, payload: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};

    if (payload.name !== undefined) {
      data.name = payload.name; // Prisma will treat this as { set: payload.name } internally
    }

    if (payload.email !== undefined) {
      data.email = payload.email;
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number) {
    return prisma.user.delete({ where: { id } });
  }
}
