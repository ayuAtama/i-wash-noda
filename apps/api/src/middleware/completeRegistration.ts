// middleware/complateRegistration.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // grab the token
    const token = req.cookies?.temp_jwt;

    if (!token) return res.status(401).json({ error: "Missing token" });

    // decode the token
    const payload = await verifyAccessToken(token);
    if (!payload) {
      console.log(payload);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // attach to request
    req.temp_jwt = payload;
    next();
  } catch (error) {
    next(error);
  }
}
