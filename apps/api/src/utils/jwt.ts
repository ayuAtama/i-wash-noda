// utils/jwt.ts
import { SignJWT, decodeJwt, jwtVerify } from "jose";
import { HttpError } from "./httpError";

if (!process.env.JWT_SECRET) {
  throw new HttpError(500, "Missing environment variable: JWT_SECRET");
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const defaultExpiresIn = process.env.JWT_EXPIRES_IN || "15m";

export async function signToken(
  payload: Record<string, any>,
  expiresIn?: string
) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn || defaultExpiresIn)
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload; // valid
  } catch (err) {
    return null; // invalid or expired
  }
}

export async function decodeToken(token: string) {
  try {
    return decodeJwt(token); // payload only
  } catch (err) {
    return null; // malformed only
  }
}
