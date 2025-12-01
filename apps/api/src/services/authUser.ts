// apps/api/src/services/authUser.ts
import { prisma } from "../config/prisma";
import type { Prisma } from "../generated/prisma/client";
import { generate6DigitCode, hashToken } from "../utils/tokenGenerator";

export class AuthUserService {
  async register(data: any) {
    try {
      // add type checking later
      const result = await prisma.$transaction(async (tx) => {
        // 1. create user
        const user = await tx.user.create({
          data,
        });

        // 2. Generate and store verification token
        const token = generate6DigitCode();
        const hashedToken = hashToken(token);

        const verificationToken = await tx.verificationToken.create({
          data: {
            token: hashedToken,
            expires_at: new Date(Date.now() + 1000 * 60 * 10), // 10 Minutes
            user_id: user.id,
          },
        });

        return { user, rawToken: token };
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

  async verify(data: any) {}
}
