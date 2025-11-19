// apps/api/src/services/user.service.ts
import prisma from "../config/prisma.js";
import type { Prisma } from "../config/generated/client.js";
import type {
  CreateUserDto,
  UpdateUserDto,
} from "../validations/user.validation.js";

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

// apps/api/src/services/user.service.ts

// import type { Prisma, User } from "../config/generated/client.js";
// // ↑ only types from generated client

// import type { PrismaClient } from "@prisma/client";
// // ↑ the actual PrismaClient type MUST come from @prisma/client

// import type {
//   CreateUserDto,
//   UpdateUserDto,
// } from "../validations/user.validation.js";

// export class UserService {
//   private prisma: PrismaClient;

//   constructor(prismaClient: PrismaClient) {
//     this.prisma = prismaClient;
//   }

//   async getAll() {
//     return this.prisma.user.findMany();
//   }

//   async getById(id: number) {
//     return this.prisma.user.findUnique({ where: { id } });
//   }

//   async create(data: CreateUserDto) {
//     return this.prisma.user.create({ data });
//   }

//   async update(id: number, payload: UpdateUserDto) {
//     const data: Prisma.UserUpdateInput = {};

//     if (payload.name !== undefined) {
//       data.name = payload.name;
//     }

//     if (payload.email !== undefined) {
//       data.email = payload.email;
//     }

//     return this.prisma.user.update({
//       where: { id },
//       data,
//     });
//   }

//   async delete(id: number) {
//     return this.prisma.user.delete({ where: { id } });
//   }
// }
