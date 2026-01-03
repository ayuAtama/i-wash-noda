import { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils/httpError";
import { verifyToken } from "@/utils/jwt";
import { auth } from "@/utils/auth";
import { fromNodeHeaders } from "better-auth/node";
import { isUserRole } from "@/types/role";

// export async function authenticationMiddleware(
//   req: Request,
//   _res: Response,
//   next: NextFunction
// ) {
//   try {
//     // get the token from cookies
//     const cookieAccessToken = req.cookies.access_token;

//     // check if the cookies' token missing
//     if (!cookieAccessToken) {
//       throw new HttpError(401, "Unauthorized");
//     }

//     // decode the token and check if valid
//     const decodedAccessToken = await verifyToken(cookieAccessToken);
//     if (!decodedAccessToken) {
//       throw new HttpError(401, "Unauthorized Please login first");
//     }

//     // attach the decoded token to express' request
//     req.access_token = decodedAccessToken;

//     //////////////////////////////
//     // better auth social login
//     //////////////////////////////

//     // get the session
//     const session = await auth.api.getSession({
//       headers: fromNodeHeaders(req.headers),
//     });
//     if (!session) throw new HttpError(401, "Unauthorized Please login first");

//     // normalize the user's role type
//     const { user } = session;
//     if (!isUserRole(user.role)) {
//       throw new HttpError(403, "Invalid user role");
//     }

//     // attach the user data from session match into express' request accesstoken
//     req.user = {
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       emailVerified: user.emailVerified,
//       image: user.image ?? null,
//       role: user.role,
//       createdAt: user.createdAt,
//       updatedAt: user.updatedAt,
//     };

//     next();
//   } catch (error) {
//     next(error);
//   }
// }

export async function authenticationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
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
      const decoded = await verifyToken(jwtToken);
      if (!decoded) throw new HttpError(401, "Unauthorized Please login first");

      // normalize the role
      if (!isUserRole(decoded.role)) {
        throw new HttpError(403, "Invalid role");
      }

      // attach the decoded token to express' request
      req.access_token = decoded;

      // next middlewere
      return next();
    } else {
      /* ===== BETTER AUTH PATH ===== */

      // get the session from better auth
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      // throw error if the session and the jwt access token missing
      if (!session) {
        throw new HttpError(401, "Unauthorized Please login first");
      }

      // normalize the role
      const { user } = session;
      if (!isUserRole(user.role)) {
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
}
