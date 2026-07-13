// apps/api/src/services/admin.services.ts
import { prisma } from "@/config/prisma";
import { Prisma, Role } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";
import { sendVerifyEmailbyAdmin } from "@/utils/mail";
import { validateMXRecord } from "@/utils/mxRecordValidatior";
import { generate6DigitCode, hashToken } from "@/utils/tokenGenerator";
import { addHours } from "date-fns";

export class AdminService {
  async registerInternalUser(data: Prisma.UserCreateInput) {
    try {
      // create the user
      const { result, userId, hashedToken, email, role } =
        await prisma.$transaction(async (tx) => {
          // 0. handle register error
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

          // 0.5. check the email's domain (mx record)
          const validDomain = await validateMXRecord(
            data.email.toLocaleLowerCase().trim(),
          );
          if (!validDomain) {
            throw new HttpError(422, "Please retry with real email address");
          }

          // create the internal user
          const user = await tx.user.create({
            data,
          });

          // make a random token
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

  async deleteUser(userId: string) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { is_deleted: true },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async changeRole(userId: string, role: Role) {
    try {
      return await prisma.user.update({
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
        prisma.user.findMany({
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
        prisma.user.count({ where }),
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
