// apps/api/src/services/authUser.ts
import { prisma } from "@/config/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { generate6DigitCode, hashToken } from "@/utils/tokenGenerator";
import { signAccessToken } from "@/utils/jwt";

export class AuthUserService {
  async register(data: Prisma.UserCreateInput) {
    try {
      // add type checking later
      const result = await prisma.$transaction(async (tx) => {
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
            expires_at: new Date(Date.now() + 1000 * 60 * 60), // 60 Minutes
            user_id: user.id,
          },
        });

        return { user, rawToken: token, hashedToken };
      });

      // forward the result to the controller
      return result;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Email already exist");
      }
      // throw error
      throw new Error(error.message || "Registration failed");
    }
  }

  async verify(token: string) {
    try {
      // make the token input normalized (hashed)
      //const hashedToken = hashToken(token);

      //check if it is a hashed token
      const normalizedToken = token.length > 10 ? token : hashToken(token);

      // check if token matched with hashed token in database
      const record = await prisma.verificationToken.findFirst({
        where: {
          token: normalizedToken,
          //OR: [{ token: token }, { token: hashedToken }],
          used: false,
          expires_at: { gt: new Date() },
        },
        include: {
          user: true,
        },
      });

      // throw error if not found
      if (!record) {
        throw new Error("Invalid token or expired verification token");
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

      // return the result into controller
      return { success: true, message: "Email verified successfully" };
    } catch (error: any) {
      // throw error
      throw new Error(error.message || "Verification failed");
    }
  }

  async resendVerificationEmail(email: string) {
    // normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // find the user
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) throw new Error("User not found");
    if (user.emailVerified) throw new Error("Email already verified");

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
      const secondsSinceLastToken =
        (Date.now() - existingToken.created_at.getTime()) / 1000;

      // Example limit: 60 seconds between sends
      if (secondsSinceLastToken < 60) {
        throw new Error(
          `Please wait ${Math.ceil(60 - secondsSinceLastToken)} seconds before requesting another verification email.`
        );
      }

      // Optionally: mark old token as used or delete it
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
        expires_at: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    return { user, rawToken, hashedToken: newToken.token };
  }
}
