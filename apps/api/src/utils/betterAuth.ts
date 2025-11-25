// import { toNodeHandler } from "better-auth/node";
// import { auth } from "./auth";

// export class BetterAuthMiddleware {
//   public static handler() {
//     return toNodeHandler(auth);
//   }
// }
// src/utils/betterAuth.ts
import type { Request, Response, NextFunction } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

export class BetterAuthMiddleware {
  public static handler() {
    const nodeHandler = toNodeHandler(auth);

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
