import { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils/httpError";
import { verifyToken } from "@/utils/jwt";

export async function authenticationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    // get the token from cookies
    const cookieAccessToken = req.cookies.access_token;

    // check if the cookies' token missing
    if (!cookieAccessToken) {
      throw new HttpError(401, "Unauthorized");
    }

    // decode the token and check if valid
    const decodedAccessToken = await verifyToken(cookieAccessToken);
    if (!decodedAccessToken) {
      throw new HttpError(401, "Unauthorized Please login first");
    }

    // attach the decoded token to express' request
    req.access_token = decodedAccessToken;

    next();
  } catch (error) {
    next(error);
  }
}
