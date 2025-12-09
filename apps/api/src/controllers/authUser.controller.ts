// src/controllers/authUser.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AuthUserService } from "../services/authUser.services";
import { sendVerificationEmail } from "../utils/mail";
import { HttpError } from "@/utils/httpError";

export class AuthUserController {
  private authUserService: AuthUserService;

  constructor(authUserService: AuthUserService) {
    this.authUserService = authUserService;
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // create user + token
      const { user, accessToken } = await this.authUserService.register(
        req.body
      );

      // set the next step for continue registration (temp cookie)
      res.cookie("next_step", 1, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        maxAge: 365 * 24 * 60 * 60 * 1000, // (1 year)
        path: "/",
      });

      // set the temp jwt for continue registration (temp cookie)
      res.cookie("temp_jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        maxAge: 60 * 60 * 1000, // (1 hour)
        path: "/",
      });

      // return response
      return res.status(201).json({
        message: "User registered. Verification email sent.",
        "email verified": user.emailVerified,
      });
    } catch (err) {
      next(err);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // store the hashed token from query or the raw token from body
      const token = req.query.token || req.body.token;

      //check if token is valid
      if (!token) {
        throw new HttpError(400, "Token required");
      }

      // verify the token
      const result = await this.authUserService.verify(token);

      // set the temp jwt for continue registration (temp cookie)
      res.cookie("temp_jwt", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        maxAge: 60 * 60 * 1000, // (1 hour)
        path: "/",
      });

      // set the next step for complete registration (temp cookie)
      res.cookie("next_step", 2, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        maxAge: 365 * 24 * 60 * 60 * 1000, // (1 year)
        path: "/",
      });

      // return response
      return res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  resendVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const email = req.body.email;
      if (!email) {
        throw new HttpError(400, "Email required");
      }

      // Service now returns: { rawToken, hashedToken, user }
      const { rawToken, hashedToken, user } =
        await this.authUserService.resendVerificationEmail(email);

      // SEND EMAIL HERE
      await sendVerificationEmail(user.email, rawToken, hashedToken);

      return res
        .status(201)
        .json({ message: "Verification email resent successfully" });
    } catch (err) {
      next(err);
    }
  };

  completeRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // get the decoded jwt from middleware
      const tempJwt = req.temp_jwt;

      if (!tempJwt) throw new HttpError(400, "Missing token");

      // get the email
      const email = req.body.email;
      if (!email) throw new HttpError(400, "Email required");

      // check if the email matches the temp jwt
      if (tempJwt.email !== email) {
        throw new HttpError(400, "Invalid token");
      }

      // get the data
      const payload = req.body;

      // update the user's data
      const updatedUser = await this.authUserService.updateUserDataRegistration(
        tempJwt,
        email,
        payload
      );

      // set the next step to empty for finishing registration (temp cookie)
      res.cookie("next_step", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        maxAge: 365 * 24 * 60 * 60 * 1000 * 0, // (expires now)
        path: "/",
      });

      // return response
      return res.status(201).json(updatedUser);
    } catch (err) {
      next(err);
    }
  };
}
