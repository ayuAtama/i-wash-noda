import { verifyToken } from "@/utils/jwt";
import { isUserRole } from "@/types/role";
import { auth } from "@/utils/auth";
import { fromNodeHeaders } from "better-auth/node";
import type { UserRole } from "@/types/auth";
import { Socket } from "socket.io";

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const cookie of cookieHeader.split(";")) {
    const idx = cookie.indexOf("=");
    if (idx === -1) continue;
    const name = cookie.slice(0, idx).trim();
    const value = cookie.slice(idx + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
  }
  return cookies;
}

export interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  image?: string | null;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
}

export async function socketAuthenticationMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const jwtToken = cookies.access_token;

    /* ===== JWT PATH ===== */
    if (jwtToken) {
      const decoded = await verifyToken(jwtToken);
      if (!decoded) {
        console.warn(`[Socket] ${socket.id} - Invalid or expired JWT`);
        return next(new Error("Unauthorized: Invalid or expired token"));
      }

      if (!isUserRole(decoded.role)) {
        console.warn(`[Socket] ${socket.id} - Invalid role: ${decoded.role}`);
        return next(new Error("Forbidden: Invalid role"));
      }

      socket.data.user = decoded;
      return next();
    }

    /* ===== BETTER AUTH PATH ===== */
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(
          socket.handshake.headers as Record<string, string>,
        ),
      });

      if (!session) {
        console.warn(`[Socket] ${socket.id} - Not authenticated`);
        return next(new Error("Unauthorized: Please login first"));
      }

      const { user } = session;
      if (!isUserRole(user.role)) {
        return next(new Error("Forbidden: Invalid role"));
      }

      socket.data.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image ?? null,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return next();
    } catch {
      return next(new Error("Unauthorized: Authentication failed"));
    }
  } catch (err) {
    console.error("[Socket] Authentication error:", err);
    return next(new Error("Unauthorized: Authentication error"));
  }
}
