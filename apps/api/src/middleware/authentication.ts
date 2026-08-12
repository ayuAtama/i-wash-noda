import { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils/httpError";
import { JwtService } from "@/utils/jwt";
import { BetterAuth } from "@/utils/auth";
import { fromNodeHeaders } from "better-auth/node";
import { UserRoleValidator } from "@/types/role";

export class AuthenticationMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly auth: BetterAuth,
  ) {}

  handler = async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // get the token from cookies
      const jwtToken = req.cookies?.access_token;

      /* ===== JWT PATH ===== */
      if (jwtToken) {
        // double check to prevent csrf attack
        // const authorization = req.headers.authorization;
        // if (authorization !== jwtToken) {
        //   throw new HttpError(401, "Unauthorized");
        // }
        // decode the token
        const decoded = await this.jwt.verifyToken(jwtToken);
        if (!decoded)
          throw new HttpError(401, "Unauthorized Please login first");

        // normalize the role
        if (!UserRoleValidator.isUserRole(decoded.role)) {
          throw new HttpError(403, "Invalid role");
        }

        // attach the decoded token to express' request
        req.access_token = decoded;

        // next middlewere
        return next();
      } else {
        /* ===== BETTER AUTH PATH ===== */

        // get the session from better auth
        const session = await this.auth.getSession(
          fromNodeHeaders(req.headers),
        );

        // throw error if the session and the jwt access token missing
        if (!session) {
          throw new HttpError(401, "Unauthorized Please login first");
        }

        // normalize the role
        const { user } = session;
        if (!UserRoleValidator.isUserRole(user.role)) {
          throw new HttpError(403, "Invalid role");
        }

        // attach the user data from session match into express' request
        req.user = {
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
      }
    } catch (error) {
      next(error);
    }
  };
}

export const authenticationMiddleware = new AuthenticationMiddleware(
  JwtService.getInstance(),
  BetterAuth.getInstance(),
);
