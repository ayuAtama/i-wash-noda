// apps/api/src/services/user.service.ts
import { prisma } from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";
import type {
  CreateUserDto,
  UpdateUserDto,
} from "../validations/user.validation";

export class UserService {
  async getAll(page: number = 1, limit: number = 10) {
    const { skip, take } = { skip: (page - 1) * limit, take: limit };
    const where = {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take }),
      prisma.user.count({ where }),
    ]);
    return {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserDto | any) {
    return prisma.user.create({ data });
  }

  async update(id: number | any, payload: UpdateUserDto) {
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

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }
}
