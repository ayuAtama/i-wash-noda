// apps/api/src/services/authUser.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  generate6DigitCode,
  hashToken,
  hashPassword,
  generateSessionId,
  hashSessionId,
  comparePassword,
} from "@/utils/tokenGenerator";
import {
  sendEmailChangeVerification,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendVerifyEmailbyAdmin,
} from "@/utils/mail";
import { signToken } from "@/utils/jwt";
import { HttpError } from "@/utils/httpError";
import {
  addDays,
  addHours,
  differenceInSeconds,
  formatDate,
  formatDistanceStrict,
} from "date-fns";
import { validateMXRecord } from "@/utils/mxRecordValidatior";
import {
  CompleteRegisterDto,
  LoginDto,
  UpdateMeDto,
  VerifyServiceDto,
  ResetPasswordServiceDto,
  SetNewEmailServiceDto,
  RegisterDto,
  EmailDto,
  temp_jwtDTO,
  UserIdDto,
  SessionIdDto,
} from "@/validations/auth.validation";
import { deleteImage } from "@/utils/cloudinary";


export class AuthUserService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async register(data: RegisterDto) {
    try {
      if (!data.email || !data.email.includes("@")) {
        throw new HttpError(400, "Invalid email format");
      }

      const result = await this.prisma.$transaction(async (tx) => {
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
          data: data,
        });

        const token = generate6DigitCode();
        const hashedToken = hashToken(token);

        await tx.verificationToken.create({
          data: {
            token: hashedToken,
            expires_at: addHours(new Date(), 1),
            user_id: user.id,
          },
        });

        return { user, token, hashedToken };
      });

      await sendVerificationEmail(
        result.user.email,
        result.token,
        result.hashedToken,
      );

      const tokenPayload = {
        sub: result.user.id,
        email: result.user.email,
      };
      const accessToken = await signToken(tokenPayload, "365d");

      const finalData = {
        ...result,
        accessToken,
      };
      return finalData;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }

  async verify(
    token: VerifyServiceDto["token"],
    tempJwtEmail: VerifyServiceDto["tempJwtEmail"],
    userId?: VerifyServiceDto["userId"],
  ) {
    try {
      if (!token || token.length < 6) {
        throw new HttpError(400, "Invalid token");
      }

      const normalizedToken = token.length > 10 ? token : hashToken(token);

      const record = await this.prisma.verificationToken.findFirst({
        where: {
          token: normalizedToken,
          ...(userId ? { user_id: userId } : {}),
          used: false,
          expires_at: { gt: new Date() },
          ...(tempJwtEmail ? { user: { email: tempJwtEmail } } : {}),
        },
        include: {
          user: true,
        },
      });

      if (!record) {
        throw new HttpError(400, "Invalid token or expired verification token");
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.verificationToken.update({
          where: {
            id: record.id,
          },
          data: {
            used: true,
          },
        });
        await tx.user.update({
          where: {
            id: record.user.id,
          },
          data: {
            emailVerified: true,
          },
        });
      });

      const tokenPayload = {
        sub: record.user.id,
        email: record.user.email,
      };
      const accessToken = await signToken(tokenPayload, "365d");

      return {
        success: true,
        message: "Email verified successfully",
        accessToken,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }

  async resendVerificationEmail(email: EmailDto) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const user = await this.prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user)
        throw new HttpError(404, "User not found please register first!");
      if (user.emailVerified && user.password !== null)
        throw new HttpError(409, "Email already verified");

      if (!user.emailVerified && user.password === null) {
        const existingToken = await this.prisma.verificationToken.findFirst({
          where: {
            user_id: user.id,
            used: false,
            expires_at: { gt: new Date() },
          },
          orderBy: { created_at: "desc" },
        });

        if (existingToken) {
          const secondsSinceLastToken = differenceInSeconds(
            new Date(),
            existingToken.created_at,
          );

          if (secondsSinceLastToken < 60) {
            const wait = 60 - secondsSinceLastToken;
            throw new HttpError(
              429,
              `Please wait ${formatDistanceStrict(0, wait * 1000)} before requesting another verification email.`,
            );
          }

          await this.prisma.verificationToken.update({
            where: { id: existingToken.id },
            data: { used: true },
          });
        }

        const rawToken = generate6DigitCode();
        const hashedToken = hashToken(rawToken);

        const newToken = await this.prisma.verificationToken.create({
          data: {
            user_id: user.id,
            token: hashedToken,
            expires_at: addHours(new Date(), 1),
          },
        });

        if (user.role === "customer") {
          await sendVerificationEmail(user.email, rawToken, newToken.token);
        }

        if (user.role !== "customer") {
          await sendVerifyEmailbyAdmin(
            user.email,
            user.id,
            newToken.token,
            user.role,
          );
        }

        const tokenPayload = {
          sub: user.id,
          email: user.email,
        };
        const accessToken = await signToken(tokenPayload, "365d");

        return {
          success: true,
          status: "unverified",
          accessToken,
        };
      }

      if (user.emailVerified && user.password === null) {
        const tokenPayload = {
          sub: user.id,
          email: user.email,
        };
        const accessToken = await signToken(tokenPayload, "365d");

        return {
          success: true,
          status: "verified",
          accessToken,
        };
      }

      return {
        success: true,
        status: "verified and completed registration",
        accessToken: null,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }

  async completeUserDataRegistration(
    temp_jwt: temp_jwtDTO,
    email: EmailDto,
    data: CompleteRegisterDto,
    userAgent: string | null,
  ) {
    try {
      if (temp_jwt.email !== email) {
        throw new HttpError(400, "Invalid token");
      }

      const rawPassword = String(data.password);
      const hashedPassword = hashPassword(rawPassword);

      const updatedData = {
        ...data,
        password: hashedPassword,
      };

      const { updatedUser, sessionId } = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email },
            select: { emailVerified: true },
          });

          if (!user) {
            throw new HttpError(404, "User not found");
          }

          if (!user.emailVerified) {
            throw new HttpError(400, "Email not verified");
          }

          const updatedUser = await tx.user.update({
            where: { email },
            data: updatedData as Prisma.UserUpdateInput,
          });

          const sessionId = generateSessionId();
          const hashedSessionId = hashSessionId(sessionId);
          const uA = userAgent;
          await tx.session.create({
            data: {
              userId: updatedUser.id,
              token: hashedSessionId,
              expiresAt: addDays(new Date(), 7),
              userAgent: uA,
            },
          });

          return { updatedUser, sessionId };
        },
      );

      const accessTokenPayload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      const accessToken = await signToken(accessTokenPayload, "15m");

      const refreshTokenPayload = {
        sub: updatedUser.id,
        sid: sessionId,
      };

      const refreshToken = await signToken(refreshTokenPayload, "7d");

      return {
        success: true,
        message: "User data updated successfully",
        dataUser: updatedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }

  async logout(sub: UserIdDto) {
    try {
      const userId = sub;

      await this.prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  async login(
    email: LoginDto["email"],
    password: LoginDto["password"],
    userAgent: string | null,
    ip: string,
  ) {
    try {
      const userPassword = password;
      const userEmail = email.toLocaleLowerCase().trim();
      if (!userEmail && !userPassword) {
        throw new HttpError(400, "Invalid email or password");
      }

      const updateData = await this.prisma.user.findUnique({
        where: {
          email: userEmail,
        },
      });

      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      if (!updateData.password || !updateData.emailVerified) {
        throw new HttpError(400, "Please complete your registration first");
      }

      const isPasswordMatch = comparePassword(
        userPassword,
        updateData.password,
      );

      if (!isPasswordMatch) {
        throw new HttpError(400, "Invalid password please try again");
      }

      const { sessionId } = await this.prisma.$transaction(async (tx) => {
        const sessionId = generateSessionId();
        const hashedSessionId = hashSessionId(sessionId);
        const uA = userAgent;

        await tx.session.create({
          data: {
            userId: updateData.id,
            token: hashedSessionId,
            expiresAt: addDays(new Date(), 7),
            userAgent: uA,
            ipAddress: ip,
          },
        });

        return { sessionId };
      });

      const accessTokenPayload = {
        sub: updateData.id,
        email: updateData.email,
        role: updateData.role,
      };
      const accessToken = await signToken(accessTokenPayload, "15m");

      const refreshTokenPayload = {
        sub: updateData.id,
        sid: sessionId,
      };
      const refreshToken = await signToken(refreshTokenPayload, "7d");

      return {
        success: true,
        message: `Login with email ${updateData.email} was successfull`,
        accessToken,
        refreshToken,
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        worker_station: updateData.worker_station,
      };
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken(sub: UserIdDto, sid: SessionIdDto) {
    try {
      const hashedSessionId = hashSessionId(sid);

      const updateData = await this.prisma.user.findUnique({
        where: {
          id: sub,
        },
      });

      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      const sessionId = await this.prisma.session.findUnique({
        where: {
          userId: updateData.id,
          token: hashedSessionId,
        },
      });
      if (!sessionId) {
        throw new HttpError(401, "Unauthorized no session id in database");
      }

      const accessTokenPayload = {
        sub: updateData.id,
        email: updateData.email,
        role: updateData.role,
      };
      const accessToken = await signToken(accessTokenPayload, "15m");

      const { newRefreshToken } = await this.prisma.$transaction(async (tx) => {
        const newSessionId = generateSessionId();
        const newHashedSessionId = hashSessionId(newSessionId);

        await tx.session.update({
          where: {
            id: sessionId.id,
            token: hashedSessionId,
          },
          data: {
            userId: updateData.id,
            token: newHashedSessionId,
            expiresAt: addDays(new Date(), 7),
          },
        });

        return { newRefreshToken: newSessionId };
      });

      const newRefreshTokenPayload = {
        sub: updateData.id,
        sid: newRefreshToken,
      };
      const refreshToken = await signToken(newRefreshTokenPayload, "7d");

      return {
        success: true,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async resetRequest(email: EmailDto) {
    try {
      const updateData = await this.prisma.user.findUnique({
        where: {
          email: email,
          password: {
            not: null,
          },
          emailVerified: true,
        },
      });

      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      const resetToken = generateSessionId();
      const hashedResetToken = hashSessionId(resetToken);

      const { token } = await this.prisma.passwordResetToken.create({
        data: {
          user_id: updateData.id,
          token: hashedResetToken,
          expires_at: addHours(new Date(), 1),
          used: false,
        },
      });

      await sendPasswordResetEmail(email, token);

      const payload = {
        sub: updateData.id,
        email: updateData.email,
      };

      const tempJwt = await signToken(payload);

      return {
        success: true,
        message: `Password reset link sent to ${email}`,
        updateData,
        tempJwt,
      };
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(
    jwt_email: ResetPasswordServiceDto["jwt_email"],
    email: ResetPasswordServiceDto["email"],
    verificationToken: ResetPasswordServiceDto["verificationToken"],
    password: ResetPasswordServiceDto["password"],
  ) {
    try {
      if (email !== jwt_email) {
        throw new HttpError(401, "Unauthorized, email not match");
      }

      const updateData = await this.prisma.user.findUnique({
        where: {
          email: email,
          password: {
            not: null,
          },
          emailVerified: true,
        },
      });

      if (!updateData) {
        throw new HttpError(404, "User not found");
      }

      const record = await this.prisma.passwordResetToken.findFirst({
        where: {
          user_id: updateData.id,
          expires_at: { gt: new Date() },
          used: false,
          token: verificationToken,
        },
      });
      if (!record) {
        throw new HttpError(401, "Unauthorized, verification token not found");
      }
      if (record.token !== verificationToken) {
        throw new HttpError(401, "Unauthorized, verification token not match");
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.update({
          where: {
            id: record.id,
          },
          data: {
            used: true,
          },
        });
      });

      const hashedPassword = hashPassword(password);

      await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            email: email,
            id: updateData.id,
            emailVerified: true,
          },
          data: {
            password: hashedPassword,
          },
        });
      });

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchMe(sub: UserIdDto) {
    try {
      const updateData = await this.prisma.user.findUnique({
        where: {
          id: sub,
        },
      });
      if (!updateData) throw new HttpError(404, "User not found");

      const user = {
        name: updateData.name,
        email: updateData.email,
        "pending email": updateData.pending_email,
        "email verified": updateData.emailVerified,
        role: updateData.role,
        image: updateData.image,
        "created at": formatDate(updateData.createdAt, "PP HH:mm"),
        "updated at": formatDate(updateData.updatedAt, "PP HH:mm"),
      };

      return { message: "User fetched successfully", success: true, user };
    } catch (error) {
      throw error;
    }
  }

  async updateMe(sub: UserIdDto, data: UpdateMeDto) {
    try {
      const userId = sub;
      const { name, password } = data;

      let hashedPassword = null as string | null;
      if (password) {
        hashedPassword = hashPassword(password);
      }

      const payload = {
        name,
        ...(hashedPassword ? { password: hashedPassword } : {}),
      };

      const updateData = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: payload,
      });

      const user = {
        name: updateData.name,
        email: updateData.email,
        password: "New password created: ******",
        "created at": formatDate(updateData.createdAt, "PP HH:mm"),
        "updated at": formatDate(updateData.updatedAt, "PP HH:mm"),
      };

      return user;
    } catch (error) {
      throw error;
    }
  }

  async emailRequestChange(sub: UserIdDto, email: EmailDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: sub,
        },
      });
      if (!user) throw new HttpError(404, "User not found");

      const { token, tempJwt } = await this.prisma.$transaction(async (tx) => {
        const newEmailToken = generateSessionId();
        const hashedNewEmailToken = hashSessionId(newEmailToken);

        const userNewEmail = await tx.user.update({
          where: {
            id: user.id,
            emailVerified: true,
          },
          data: {
            pending_email: email,
          },
        });

        const token = await tx.verificationToken.create({
          data: {
            user_id: userNewEmail.id,
            token: hashedNewEmailToken,
            used: false,
            expires_at: addHours(new Date(), 1),
          },
        });

        const tempJwtPayload = {
          sub: userNewEmail.id,
          email: email,
        };

        const tempJwt = await signToken(tempJwtPayload, "1h");

        return { token: token.token, tempJwt: tempJwt };
      });

      await sendEmailChangeVerification(email, token);

      return {
        success: true,
        message: `Email change request to ${email} sent successfully`,
        tempJwt,
      };
    } catch (error) {
      throw error;
    }
  }

  async setNewEmail(
    jwt_email: SetNewEmailServiceDto["jwt_email"],
    newEmail: SetNewEmailServiceDto["newEmail"],
    oldEmail: SetNewEmailServiceDto["oldEmail"],
    verificationToken: SetNewEmailServiceDto["verificationToken"],
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: oldEmail,
          password: {
            not: null,
          },
          emailVerified: true,
        },
      });
      if (!user) throw new HttpError(404, "User not found");

      const tokenRecord = await this.prisma.verificationToken.findFirst({
        where: {
          user_id: user.id,
          expires_at: { gt: new Date() },
          used: false,
          token: verificationToken,
        },
      });
      if (!tokenRecord)
        throw new HttpError(400, "Invalid token, please retry again later");

      const { userNewEmail } = await this.prisma.$transaction(async (tx) => {
        await tx.verificationToken.update({
          where: {
            id: tokenRecord.id,
          },
          data: {
            used: true,
          },
        });

        const userNewEmail = await tx.user.update({
          where: {
            id: user.id,
            emailVerified: true,
          },
          data: {
            email: newEmail,
            pending_email: null,
          },
        });

        return { userNewEmail };
      });

      const result = {
        name: userNewEmail.name,
        email: userNewEmail.email,
        "pending email": userNewEmail.pending_email,
        "email verified": userNewEmail.emailVerified,
        role: userNewEmail.role,
        image: userNewEmail.image,
        "created at": formatDate(userNewEmail.createdAt, "PP HH:mm"),
        "updated at": formatDate(userNewEmail.updatedAt, "PP HH:mm"),
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateAvatar(userId: string, imageUrl: string) {
    try {
      if (!z.string().uuid().safeParse(userId).success) {
        throw new HttpError(
          400,
          "Invalid user ID format",
          undefined,
          "AVATAR_INVALID_USER_ID",
        );
      }

      if (!imageUrl.includes("cloudinary.com")) {
        throw new HttpError(
          400,
          "Invalid image URL",
          undefined,
          "AVATAR_INVALID_URL",
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      if (!user) {
        throw new HttpError(
          404,
          "User not found",
          undefined,
          "AVATAR_USER_NOT_FOUND",
        );
      }

      if (user.image) {
        await deleteImage(user.image);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
        select: { image: true },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }

  async deleteAvatar(userId: string) {
    try {
      if (!z.string().uuid().safeParse(userId).success) {
        throw new HttpError(
          400,
          "Invalid user ID format",
          undefined,
          "AVATAR_INVALID_USER_ID",
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });

      if (!user) {
        throw new HttpError(
          404,
          "User not found",
          undefined,
          "AVATAR_USER_NOT_FOUND",
        );
      }

      if (user.image) {
        await deleteImage(user.image);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { image: null },
        select: { image: true },
      });

      return updatedUser;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw error;
    }
  }
}
