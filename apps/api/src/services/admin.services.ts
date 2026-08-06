// apps/api/src/services/admin.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { sendVerifyEmailbyAdmin } from "@/utils/mail";
import { validateMXRecord } from "@/utils/mxRecordValidatior";
import { generate6DigitCode, hashToken } from "@/utils/tokenGenerator";
import { addHours } from "date-fns";
import {
  RegisterInternalUserDto,
  ChangeRoleDto,
  UserIdParamDto,
} from "@/validations/admin.validation";

export class AdminService {
  // private readonly prisma: PrismaWrapper;

  // constructor(prismaClient: PrismaWrapper = prisma) {
  //   this.prisma = prismaClient;
  // }

  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async registerInternalUser(data: RegisterInternalUserDto) {
    try {
      const { result, userId, hashedToken, email, role } =
        await this.prisma.$transaction(async (tx) => {
          const existingUserNotCompleted = await tx.user.findUnique({
            where: {
              email: data.email.toLocaleLowerCase().trim(),
              password: null,
              is_deleted: false,
            },
          });

          if (existingUserNotCompleted) {
            throw new HttpError(
              409,
              "User already exist but not completed registration",
            );
          }

          const validDomain = await validateMXRecord(
            data.email.toLocaleLowerCase().trim(),
          );
          if (!validDomain) {
            throw new HttpError(422, "Please retry with real email address");
          }

          const user = await tx.user.create({
            data,
          });

          const generateToken = generate6DigitCode();
          const hashedToken = hashToken(generateToken);

          const { token } = await tx.verificationToken.create({
            data: {
              token: hashedToken,
              user_id: user.id,
              expires_at: addHours(new Date(), 1),
            },
          });

          return {
            result: user,
            userId: user.id,
            hashedToken: token,
            email: user.email,
            role: user.role,
          };
        });

      try {
        await sendVerifyEmailbyAdmin(email, userId, hashedToken, role);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(userId: UserIdParamDto["userId"]) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { is_deleted: true },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async changeRole(
    userId: ChangeRoleDto["userId"],
    role: ChangeRoleDto["role"],
  ) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { role: role },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async getAllUser(page: number = 1, limit: number = 10) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = { is_deleted: false, emailVerified: true };
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          omit: {
            pending_email: true,
            password: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            is_deleted: true,
          },
          skip,
          take,
        }),
        this.prisma.user.count({ where }),
      ]);
      return {
        data: users,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };

    } catch (error) {
      throw error;
    }
  }
}
