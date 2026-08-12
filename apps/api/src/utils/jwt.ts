// utils/jwt.ts
import { SignJWT, decodeJwt, jwtVerify } from "jose";
import { HttpError } from "./httpError";

export class JwtService {
  private static instance: JwtService;
  private readonly secret: Uint8Array;
  private readonly defaultExpiresIn: string;

  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new HttpError(500, "Missing environment variable: JWT_SECRET");
    }

    this.secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    this.defaultExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
  }

  static getInstance(): JwtService {
    if (!JwtService.instance) {
      JwtService.instance = new JwtService();
    }
    return JwtService.instance;
  }

  async signToken(payload: Record<string, any>, expiresIn?: string) {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresIn || this.defaultExpiresIn)
      .sign(this.secret);
  }

  async verifyToken(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.secret);
      return payload; // valid
    } catch (err) {
      return null; // invalid or expired
    }
  }

  async decodeToken(token: string) {
    try {
      return decodeJwt(token); // payload only
    } catch (err) {
      return null; // malformed only
    }
  }
}
