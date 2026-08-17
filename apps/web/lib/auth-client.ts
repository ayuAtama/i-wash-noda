import { createAuthClient } from "better-auth/react";
import { telegramClient } from "better-auth-telegram/client";

export const authClient = createAuthClient({
  // baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000", // not ngrok
  baseUrl: "", //ngrok
  plugins: [telegramClient()],
});

export const { signIn, signUp, useSession, signOut } = authClient;
