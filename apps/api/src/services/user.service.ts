import { prisma } from "../models/prisma.js";

export const UserService = {
  getAll: () => prisma.user.findMany(),

  create: (data: { name: string; email: string }) =>
    prisma.user.create({ data }),
};
