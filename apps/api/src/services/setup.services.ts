// apps/api/src/services/setup.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { hashPassword } from "@/utils/tokenGenerator";
import { SetupSuperAdminDto } from "@/validations/setup.validation";

export class SetupService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async isSetupNeeded() {
    const superAdminCount = await this.prisma.user.count({
      where: {
        role: "super_admin",
        is_deleted: false,
      },
    });

    return superAdminCount === 0;
  }

  async createSuperAdmin(data: SetupSuperAdminDto) {
    const setupNeeded = await this.isSetupNeeded();
    if (!setupNeeded) {
      throw new HttpError(409, "Super admin already exists");
    }

    const hashedPassword = hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLocaleLowerCase().trim(),
        name: data.name,
        password: hashedPassword,
        role: "super_admin",
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    return user;
  }
}
