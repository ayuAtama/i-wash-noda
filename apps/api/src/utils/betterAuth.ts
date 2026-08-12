// src/utils/betterAuth.ts
import type { Request, Response, NextFunction } from "express";
import { BetterAuth } from "./auth";

export class BetterAuthMiddleware {
  constructor(private readonly auth: BetterAuth) {}

  public handler() {
    const { auth } = this;
    const nodeHandler = auth.getNodeHandler();

    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await nodeHandler(req, res);
        // If Better Auth didn't finish the response, move on
        if (!res.headersSent) {
          next();
        }
      } catch (err) {
        next(err);
      }
    };
  }
}

export const betterAuthMiddleware = new BetterAuthMiddleware(
  BetterAuth.getInstance(),
);
