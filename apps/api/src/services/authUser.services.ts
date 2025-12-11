// apps/api/src/services/authUser.ts
import { prisma } from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  generate6DigitCode,
  hashToken,
  hashPassword,
  generateSessionId,
  hashSessionId,
} from "@/utils/tokenGenerator";
import { sendVerificationEmail } from "@/utils/mail";
import { signToken } from "@/utils/jwt";
import { HttpError } from "@/utils/httpError";
import {
  addDays,
  addHours,
  differenceInSeconds,
  formatDistanceStrict,
} from "date-fns";
import { access } from "fs";
import { validateMXRecord } from "@/utils/mxRecordValidatior";

export class AuthUserService {
  async register(data: Prisma.UserCreateInput) {
    try {
      // check if the email valid
      if (!data.email || !data.email.includes("@")) {
        throw new HttpError(400, "Invalid email format");
      }

      // handle it using transaction
      const result = await prisma.$transaction(async (tx) => {
        // 0. handle register error
        const existingUserNotCompleted = await tx.user.findUnique({
          where: {
            email: data.email.toLocaleLowerCase().trim(),
            password: null,
          },
        });

        if (existingUserNotCompleted) {
          throw new HttpError(
            409,
            "User already exist but not completed registration"
          );
        }

        // 0.5. check the email's domain (mx record)
        const validDomain = await validateMXRecord(
          data.email.toLocaleLowerCase().trim()
        );
        if (!validDomain) {
          throw new HttpError(422, "Please retry with real email address");
        }

        // 1. create user
        const user = await tx.user.create({
          data: {
            email: data.email.toLowerCase().trim(),
          },
        });

        // 2. Generate and store verification token
        const token = generate6DigitCode();
        const hashedToken = hashToken(token);

        await tx.verificationToken.create({
          data: {
            token: hashedToken,
            expires_at: addHours(new Date(), 1), // 60 Minutes
            user_id: user.id,
          },
        });

        return { user, token, hashedToken };
      });

      // email sending outside transaction (because email sending is slow and prisma transaction will be timeout first)
      await sendVerificationEmail(
        result.user.email,
        result.token,
        result.hashedToken
      );

      // make a temp access token to continue registration process
      const tokenPayload = {
        sub: result.user.id,
        email: result.user.email,
      };
      // sign the access token using jose (register)
      const accessToken = await signToken(tokenPayload, "365d");

      // finaldata
      const finalData = {
        ...result,
        accessToken,
      };
      // forward the result to the controller
      return finalData;
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async verify(token: string, tempJwt: string) {
    try {
      // check if token valid
      if (!token || token.length < 6) {
        throw new HttpError(400, "Invalid token");
      }

      //check if it is a hashed token
      const normalizedToken = token.length > 10 ? token : hashToken(token);

      //get the user id from database
      const user = await prisma.user.findUniqueOrThrow({
        where: {
          email: tempJwt,
        },
      });

      // check if token matched with hashed token in database
      const record = await prisma.verificationToken.findFirst({
        where: {
          user_id: user.id,
          token: normalizedToken,
          used: false,
          expires_at: { gt: new Date() },
        },
        include: {
          user: true,
        },
      });

      // throw error if not found
      if (!record) {
        throw new HttpError(400, "Invalid token or expired verification token");
      }

      // update token to used and verified the user
      await prisma.$transaction(async (tx) => {
        // make the token used
        await tx.verificationToken.update({
          where: {
            id: record.id,
          },
          data: {
            used: true,
          },
        });
        // make the user email verified
        await tx.user.update({
          where: {
            id: record.user.id,
          },
          data: {
            emailVerified: true,
          },
        });
      });

      // make a temp access token to continue registration process
      const tokenPayload = {
        sub: record.user.id,
        email: record.user.email,
      };
      // sign the access token using jose (verify)
      const accessToken = await signToken(tokenPayload, "365d");

      // return the result into controller
      return {
        success: true,
        message: "Email verified successfully",
        accessToken,
      };
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async resendVerificationEmail(email: string) {
    try {
      // normalize email
      const normalizedEmail = email.toLowerCase().trim();

      // find the user
      const user = await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

      if (!user)
        throw new HttpError(404, "User not found please register first!");
      if (user.emailVerified && user.password !== null)
        throw new HttpError(409, "Email already verified");

      // generate new token sending and cookie if email verified and token expired

      if (!user.emailVerified && user.password === null) {
        // Find the latest token for this user
        const existingToken = await prisma.verificationToken.findFirst({
          where: {
            user_id: user.id,
            used: false,
            expires_at: { gt: new Date() },
          },
          orderBy: { created_at: "desc" },
        });

        // Rate limiting: allow resend only every 60 seconds
        if (existingToken) {
          const secondsSinceLastToken = differenceInSeconds(
            new Date(),
            existingToken.created_at
          );

          // Example limit: 60 seconds between sends
          if (secondsSinceLastToken < 60) {
            const wait = 60 - secondsSinceLastToken;
            throw new HttpError(
              429,
              `Please wait ${formatDistanceStrict(0, wait * 1000)} before requesting another verification email.`
            );
          }

          // Mark old token as used to prevent reuse
          await prisma.verificationToken.update({
            where: { id: existingToken.id },
            data: { used: true },
          });
        }

        // Generate a new token
        const rawToken = generate6DigitCode();
        const hashedToken = hashToken(rawToken);

        // Store new token
        const newToken = await prisma.verificationToken.create({
          data: {
            user_id: user.id,
            token: hashedToken,
            expires_at: addHours(new Date(), 1), // 1 hour
          },
        });

        // resend the email to user
        await sendVerificationEmail(user.email, rawToken, newToken.token);

        // make a temp access token to continue registration process
        const tokenPayload = {
          sub: user.id,
          email: user.email,
        };
        // sign the access token using jose(resend)
        const accessToken = await signToken(tokenPayload, "365d");

        // return the result into controller
        return {
          success: true,
          status: "unverified",
          accessToken,
        };
      }

      // if the email verified but not complete the registration
      if (user.emailVerified && user.password === null) {
        // make a temp access token to continue registration process
        const tokenPayload = {
          sub: user.id,
          email: user.email,
        };
        // sign the access token using jose(resend)
        const accessToken = await signToken(tokenPayload, "365d");

        // return the result into controller
        return {
          success: true,
          status: "verified",
          accessToken,
        };
      }

      // return if the user email verified
      return {
        success: true,
        status: "verified and completed registration",
        accessToken: null,
      };
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async completeUserDataRegistration(
    temp_jwt: {
      email?: string;
    },
    email: string,
    data: Prisma.UserCreateInput,
    userAgent: string | null
  ) {
    try {
      // temp_jwt check
      if (temp_jwt.email !== email) {
        throw new HttpError(400, "Invalid token");
      }

      // handle the password hasing
      const rawPassword = String(data.password);
      const hashedPassword = hashPassword(rawPassword);

      // update the user's data using hashed password
      const updatedData = {
        ...data,
        password: hashedPassword,
      };

      // use transaction for safety
      const { updatedUser, sessionId } = await prisma.$transaction(
        async (tx) => {
          // 1. Fetch user first
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

          // 2. Update only if verified
          const updatedUser = await tx.user.update({
            where: { email },
            data: updatedData,
          });

          // 3. Generate and store session into database
          const sessionId = generateSessionId();
          const hashedSessionId = hashSessionId(sessionId);
          const uA = userAgent;
          await prisma.session.create({
            data: {
              userId: updatedUser.id,
              token: hashedSessionId,
              expiresAt: addDays(new Date(), 7), // 7 days
              userAgent: uA,
            },
          });

          // return the result
          return { updatedUser, sessionId };
        }
      );

      // make a full jwt access token
      const accessTokenPayload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      const accessToken = await signToken(accessTokenPayload, "15m");

      // make a refresh token payload fisrt
      const refreshTokenPayload = {
        sub: updatedUser.id,
        sid: sessionId,
      };

      // make a refresh token (signed)
      const refreshToken = await signToken(refreshTokenPayload, "7d");

      // return the result to controller
      return {
        success: true,
        message: "User data updated successfully",
        dataUser: updatedUser,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      // expected user error
      if (error instanceof HttpError) {
        throw error;
      }
      // Otherwise: let Prisma error + others bubble up.
      throw error;
    }
  }

  async logout(sub: string) {
    try {
      // store the userId first
      const userId = sub;

      // prisma session clear
      await prisma.session.deleteMany({
        where: {
          userId: userId,
        },
      });

      return true;
    } catch (error) {
      throw error;
    }
  }
}
