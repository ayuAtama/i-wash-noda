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

      await sendVerifyEmailbyAdmin(email, userId, hashedToken, role);

      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(id: string, adminRole: string, adminOutletId?: string) {
    try {
      const userToDelete = await prisma.user.findUnique({
        where: { id },
        select: { role: true, outlet_id: true },
      });

      if (!userToDelete) {
        throw new HttpError(404, "User not found");
      }

      if (adminRole === "outlet_admin" && userToDelete.role === "super_admin") {
        throw new HttpError(403, "Cannot delete super_admin");
      }

      if (
        adminRole === "outlet_admin" &&
        userToDelete.outlet_id !== adminOutletId
      ) {
        throw new HttpError(403, "Cannot delete users from other outlets");
      }

      return await prisma.user.update({
        where: { id },
        data: { is_deleted: true },
        select: { id: true, name: true, email: true },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw error;
    }
  }

  async changeRole(
    userId: string,
    role: Role,
    adminRole: string,
    adminOutletId?: string,
  ) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, outlet_id: true },
      });

      if (!targetUser) {
        throw new HttpError(404, "User not found");
      }

      if (adminRole === "outlet_admin") {
        if (role === "super_admin" || role === "outlet_admin") {
          throw new HttpError(
            403,
            "outlet_admin cannot assign super_admin or outlet_admin roles",
          );
        }
        if (targetUser.outlet_id !== adminOutletId) {
          throw new HttpError(403, "Cannot modify users from other outlets");
        }
      }

      return await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw error;
    }
  }

  async getAllUser() {
    try {
      return await prisma.user.findMany({
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
