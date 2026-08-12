// src/utils/auth.ts
import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { customSession } from "better-auth/plugins";
import { toNodeHandler } from "better-auth/node";
import { prisma } from "../config/prisma";

export class BetterAuth {
  private static instance: BetterAuth;
  private readonly apiUrl = process.env.API_URL || "http://localhost:3000";
  private readonly frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:3001";
  private readonly auth = this.initialize();

  constructor() {}

  public static getInstance(): BetterAuth {
    if (!BetterAuth.instance) {
      BetterAuth.instance = new BetterAuth();
    }
    return BetterAuth.instance;
  }

  private initialize() {
    return betterAuth({
      baseURL: this.apiUrl,

      // connect to database orm
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),

      // add your social providers
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID! as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET! as string,
          redirectURI: `${this.apiUrl}/api/auth/callback/github`,
        },
        twitter: {
          clientId: process.env.TWITTER_CLIENT_ID! as string,
          clientSecret: process.env.TWITTER_CLIENT_SECRET! as string,
          redirectURI: `${this.apiUrl}/api/auth/callback/twitter`,
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID! as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET! as string,
          redirectURI: `${this.apiUrl}/api/auth/callback/google`,
        },
      },

      //cors error fix
      trustedOrigins: [this.frontendUrl],

      //uuid error fix
      advanced: {
        database: {
          generateId: () => crypto.randomUUID(),
        },
      },

      // custom session response
      plugins: [
        customSession(async ({ user, session }) => {
          const roles = await this.findUserRoles(session.userId);
          return {
            user: {
              ...user,
              role: roles,
            },
            session,
          };
        }),
      ],
    });
  }

  private async findUserRoles(userId: string) {
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
    });

    return userWithRoles?.role ?? [];
  }

  public async getSession(headers: Headers) {
    return this.auth.api.getSession({ headers });
  }

  public getNodeHandler() {
    return toNodeHandler(this.auth);
  }
}

export const auth = BetterAuth.getInstance();
