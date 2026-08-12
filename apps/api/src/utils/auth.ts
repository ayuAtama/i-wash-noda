// src/utils/auth.ts
import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
// If your Prisma file is located elsewhere, you can change the path (from config)
import { prisma } from "../config/prisma";

// custom session response
import { customSession } from "better-auth/plugins";

// Add this function before your auth configuration
async function findUserRoles(userId: string) {
  // Implement your role-finding logic here using Prisma
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!userWithRoles) {
    return [];
  }
  return userWithRoles.role;
}

const API_URL = process.env.API_URL || "http://localhost:3000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

export const auth = betterAuth({
  baseURL: API_URL,

  // connect to database orm
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // add your social providers
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID! as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET! as string,
      redirectURI: `${API_URL}/api/auth/callback/github`,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID! as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET! as string,
      redirectURI: `${API_URL}/api/auth/callback/twitter`,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID! as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET! as string,
      redirectURI: `${API_URL}/api/auth/callback/google`,
    },
  },

  //cors error fix
  trustedOrigins: [FRONTEND_URL],

  //uuid error fix
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  // custom session response
  plugins: [
    customSession(async ({ user, session }) => {
      const roles = await findUserRoles(session.userId);
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
