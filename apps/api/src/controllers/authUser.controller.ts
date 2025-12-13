// src/controllers/authUser.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AuthUserService } from "../services/authUser.services";
import { HttpError } from "@/utils/httpError";
import { addDays, addMinutes, addYears, format } from "date-fns";

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
        expires: addYears(new Date(), 1), // (1 year)
        path: "/",
      });

      // set the temp jwt for continue registration (temp cookie)
      res.cookie("temp_jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 years)
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

      // get the decoded jwt from middleware
      const tempJwt = req.temp_jwt?.email;
      if (!tempJwt) throw new HttpError(400, "Missing temp jwt");

      //check if token is valid
      if (!token) {
        throw new HttpError(400, "Token required");
      }

      // verify the token
      const result = await this.authUserService.verify(token, tempJwt);

      // set the temp jwt for continue registration (temp cookie)
      res.cookie("temp_jwt", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 hour)
        path: "/",
      });

      // set the next step for complete registration (temp cookie)
      res.cookie("next_step", 2, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 year)
        path: "/",
      });

      // return response
      return res.status(201).json({
        success: result.success,
        message: result.message,
      });
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
      if (!email || (!email.includes("@") && !email.includes("."))) {
        throw new HttpError(400, "Email required");
      }

      // check status
      const { success, status, accessToken } =
        await this.authUserService.resendVerificationEmail(email);

      // if the user not verified yet (resend email)
      if (status === "unverified") {
        // set the next step for continue registration (temp cookie)
        res.cookie("next_step", 1, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 year)
          path: "/",
        });

        // set the temp jwt for continue registration (temp cookie)
        res.cookie("temp_jwt", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 years)
          path: "/",
        });

        // return a response
        return res.status(201).json({
          success: success,
          message: "Verification email resent successfully",
        });
      }

      if (status === "verified") {
        // set the temp jwt for continue registration (temp cookie)
        res.cookie("temp_jwt", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 years)
          path: "/",
        });

        // set the next step for complete registration (temp cookie)
        res.cookie("next_step", 2, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "none", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 year)
          path: "/",
        });
      }

      return res
        .status(201)
        .json({ message: "Email Verified, You can continue registration" });
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
        throw new HttpError(400, "Email does not match jwt");
      }

      // get the data
      const payload = req.body;
      // get the user Agent
      const userAgent = req.get("user-agent") || null; // if the user agent is not set, return null

      // complete register
      const { success, message, dataUser, accessToken, refreshToken } =
        await this.authUserService.completeUserDataRegistration(
          tempJwt,
          email,
          payload,
          userAgent
        );

      // set the next step to empty for finishing registration (temp cookie)
      res.clearCookie("next_step");

      // delete temp cookies
      res.clearCookie("temp_jwt");

      // set the complete full cookie (accesstoken)
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addMinutes(new Date(), 30), // (30 minutes)
        path: "/",
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addDays(new Date(), 7), // (7 days)
        path: "/",
      });

      // format the response
      const response = {
        success: success,
        message: message,
        "email verified": dataUser.emailVerified,
        role: dataUser.role,
        "created at": format(dataUser.createdAt, "PP HH:mm"),
      };

      // return response
      return res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the decoded jwt from middleware
      const userId = req.access_token?.sub;
      if (!userId) throw new HttpError(400, "You're already logout");

      // logout
      const logout = await this.authUserService.logout(userId);

      // clear the cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      // return response
      return res
        .status(200)
        .json({ success: logout, message: "Logout successful" });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the email and password and also the user agent
      if (!req.body) throw new HttpError(400, "Email and password required");
      const { email, password } = req.body;
      const userAgent = req.get("user-agent") || null;
      const ipAddress = req.ip || "";
      if (!email || !password)
        throw new HttpError(400, "Email and password required");

      // login
      const { accessToken, refreshToken, success, message } =
        await this.authUserService.login(email, password, userAgent, ipAddress);

      // set the jwt cookie httponly
      // access token 30 minute expires (jwt 15 minutes)
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addMinutes(new Date(), 30), // (30 minutes)
        path: "/",
      });

      // refresh token 7 days expires
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addDays(new Date(), 7), // (7 days)
        path: "/",
      });

      // return the response
      const response = {
        success: success,
        message: message,
      };
      return res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the decoded jwt from middleware
      const refreshToken = req.refresh_token;
      if (!refreshToken) throw new HttpError(401, "Unauthorized, login first");
      const sub = refreshToken.sub;
      const sid = refreshToken.sid;

      // check if the token is missing
      if (!sub || !sid) {
        throw new HttpError(401, "Unauthorized, sid and sub missing");
      }

      // refresh the access token
      const {
        success,
        accessToken,
        refreshToken: newRefreshToken,
      } = await this.authUserService.refreshAccessToken(sub, sid);

      // send the new access token cookie
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none", // cross-site cookie
        expires: addMinutes(new Date(), 30), // (30 minutes)
        path: "/",
      });

      // send the new refresh token cookie
      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        expires: addDays(new Date(), 7),
        path: "/",
      });

      // return the response
      return res.status(200).json({
        success: success,
        message: "Access token refreshed! and Refresh token updated !",
      });
    } catch (error) {
      next(error);
    }
  };
}
