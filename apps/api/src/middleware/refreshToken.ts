import { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils/httpError";
import { verifyToken } from "@/utils/jwt";

export async function refreshTokenMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // get the token from cookies
    if (!req.cookies) throw new HttpError(401, "Unauthorized no cookie");
    const { refresh_token: refreshToken, access_token: accessToken } =
      req.cookies;

    // check if the token is missing
    if (!refreshToken) {
      throw new HttpError(
        401,
        "Unauthorized Please login first (refresh token missing)!"
      );
    }

    // decode the access token and if invalid decode the session token
    const decodedAccessToken = await verifyToken(accessToken);
    if (decodedAccessToken) {
      throw new HttpError(200, "Your access token still valid");
    }

    // decoded the refresh token
    const decodedRefreshToken = await verifyToken(refreshToken);
    if (!decodedRefreshToken) {
      throw new HttpError(401, "Unauthorized, Please login first");
    }

    // attach the decoded token to express' request
    req.refresh_token = decodedRefreshToken;

    // continue to the next middleware
    next();
  } catch (error) {
    next(error);
  }
}
