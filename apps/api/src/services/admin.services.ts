// apps/api/src/services/admin.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { Mailer } from "@/utils/mail";
import { MXValidator } from "@/utils/mxRecordValidatior";
import { TokenGenerator } from "@/utils/tokenGenerator";
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

  constructor(
    private readonly prisma: PrismaWrapper = defaultPrisma,
    private readonly tokenGenerator: TokenGenerator = TokenGenerator.getInstance(),
    private readonly mailer: Mailer = Mailer.getInstance(),
  ) {}

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

          const validDomain = await MXValidator.validate(
            data.email.toLocaleLowerCase().trim(),
          );
          if (!validDomain) {
            throw new HttpError(422, "Please retry with real email address");
          }

          const user = await tx.user.create({
            data,
          });

          const generateToken = this.tokenGenerator.generate6DigitCode();
          const hashedToken = this.tokenGenerator.hashToken(generateToken);

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

      await this.mailer.sendVerifyEmailbyAdmin(
        email,
        userId,
        hashedToken,
        role,
      );

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

  async getAllUser() {
    try {
      return await this.prisma.user.findMany({
        where: { is_deleted: false, emailVerified: true },
        select: {
          pending_email: false,
          password: false,
          emailVerified: false,
          createdAt: false,
          updatedAt: false,
          is_deleted: false,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
