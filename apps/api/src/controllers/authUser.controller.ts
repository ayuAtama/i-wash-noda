// src/controllers/authUser.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AuthUserService } from "../services/authUser.services";
import { HttpError } from "@/utils/httpError";
import { addDays, addHours, addMinutes, addYears, format } from "date-fns";
import {
  CompleteRegisterDto,
  EmailChangeConfirmDto,
  EmailChangeRequestDto,
  LoginDto,
  RegisterDto,
  ResendDto,
  ResetConfirmDto,
  ResetRequestDto,
  UpdateMeDto,
  VerifyDtoBody,
  VerifyDtoParams,
} from "@/validations/auth.validation";

export class AuthUserController {
  private authUserService: AuthUserService;

  constructor(authUserService: AuthUserService) {
    this.authUserService = authUserService;
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Register for another user (admin)
      // const jwtToken = req.cookies?.access_token;
      // const refreshToken = req.cookies?.refresh_token;
      // if (jwtToken || refreshToken) {
      //   const decoded = await verifyToken(jwtToken);
      //   if (!decoded)
      //     throw new HttpError(401, "Token Expired, Please login first");
      //   const userRole = decoded.role;

      //   // Ensure role is valid
      //   if (!isUserRole(userRole)) {
      //     throw new HttpError(403, "Invalid role");
      //   }

      //   const canAssignRole =
      //     userRole === "super_admin" || userRole === "outlet_admin";
      //   // destructure only role and email
      //   const { role, email } = req.body;

      //   // Ensure role is valid
      //   if (!isUserRole(role)) {
      //     throw new HttpError(403, "Invalid role");
      //   }

      //   const registerPayload = {
      //     email,
      //     ...(canAssignRole && role ? { role } : {}),
      //   };

      //   const { user } = await this.authUserService.register(registerPayload);

      //   // return response
      //   return res.status(201).json({
      //     message: "User registered. Verification email sent.",
      //     "email verified": user.emailVerified,
      //     role: registerPayload.role,
      //   });
      // }

      // register for new user (regular user (costumer))
      // destructure only role and email

      // validate request body from validation midleware zod
      const payload = req.validated!.body as RegisterDto;
      if (!payload) {
        throw new HttpError(400, "Email required");
      }

      // create user + token
      const { user, accessToken } =
        await this.authUserService.register(payload);

      // set the next step for continue registration (temp cookie)
      res.cookie("next_step", 1, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 year)
        path: "/",
      });

      // set the temp jwt for continue registration (temp cookie)
      res.cookie("temp_jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 years)
        path: "/",
      });

      // return response
      return res.status(201).json({
        success: true,
        message: "User registered. Verification email sent.",
        data: {
          emailVerified: user.emailVerified,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload =
        (req.validated!.body as VerifyDtoBody) ||
        (req.validated!.query as VerifyDtoParams);

      // store the hashed token from query or the raw token from body
      //const token = req.query.token || req.body.token;
      const token = payload.token;

      // bypass the cookies next_step and temp_jwt for account created by admin (worker & driver)
      const userId = (req.query.userId as string) || req.access_token?.sub;

      //check if token is valid
      if (!token) {
        throw new HttpError(400, "Token required");
      }

      // get the decoded jwt from middleware (for self register)
      const tempJwtEmail = req.temp_jwt?.email ?? null; // null if verifying account created by admin

      // verify the token
      const result = await this.authUserService.verify(
        token,
        tempJwtEmail,
        userId,
      );

      // set the temp jwt for continue registration (temp cookie)
      res.cookie("temp_jwt", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 hour)
        path: "/",
      });

      // set the next step for complete registration (temp cookie)
      res.cookie("next_step", 2, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addYears(new Date(), 1), // (1 year)
        path: "/",
      });

      // return response
      return res.status(201).json({
        success: true,
        message: result.message,
        data: {
          emailVerified: result.success,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  resendVerification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const payload = req.validated!.body as ResendDto;
      const email = payload.email;
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
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 year)
          path: "/",
        });

        // set the temp jwt for continue registration (temp cookie)
        res.cookie("temp_jwt", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 years)
          path: "/",
        });

        // return a response
        return res.status(200).json({
          success: success,
          message: "Verification email resent successfully",
          data: null,
        });
      }

      if (status === "verified") {
        // set the temp jwt for continue registration (temp cookie)
        res.cookie("temp_jwt", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 years)
          path: "/",
        });

        // set the next step for complete registration (temp cookie)
        res.cookie("next_step", 2, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
          expires: addYears(new Date(), 1), // (1 year)
          path: "/",
        });
      }

      return res.status(201).json({
        success: success,
        message: "Email Verified, You can continue registration",
        data: null,
      });
    } catch (err) {
      next(err);
    }
  };

  completeRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the decoded jwt from middleware
      const tempJwt = req.temp_jwt;
      if (!tempJwt) throw new HttpError(400, "Missing token");

      // get the email
      const payload = req.validated!.body as CompleteRegisterDto;
      const email = payload.email;
      if (!email) throw new HttpError(400, "Email required");

      // check if the email matches the temp jwt
      if (tempJwt.email !== email) {
        throw new HttpError(400, "Email does not match jwt");
      }

      // data
      const data = {
        email: payload.email,
        name: payload.name,
        password: payload.password,
      };
      // get the user Agent
      const userAgent = req.get("user-agent") || null; // if the user agent is not set, return null

      // complete register
      const { success, message, dataUser, accessToken, refreshToken } =
        await this.authUserService.completeUserDataRegistration(
          tempJwt,
          email,
          data,
          userAgent,
        );

      // set the next step to empty for finishing registration (temp cookie)
      res.clearCookie("next_step");

      // delete temp cookies
      res.clearCookie("temp_jwt");

      // set the complete full cookie (accesstoken)
      res.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addMinutes(new Date(), 30), // (30 minutes)
        path: "/",
      });

      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addDays(new Date(), 7), // (7 days)
        path: "/",
      });

      // format the response
      const response = {
        success: true,
        message: message,
        data: {
          emailVerified: dataUser.emailVerified,
          role: dataUser.role,
          createdAt: format(dataUser.createdAt, "PP HH:mm"),
        },
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
      const userId = req.access_token?.sub || req.user?.id;
      if (!userId) throw new HttpError(400, "You're already logout");

      // logout
      const logout = await this.authUserService.logout(userId);

      // clear the cookies
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");
      res.clearCookie("better-auth.session_token"); // better auth social login

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
      const payload = req.validated!.body as LoginDto;

      // get the email and password and also the user agent
      if (!payload) throw new HttpError(400, "Email and password required");
      const { email, password } = payload;
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
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addMinutes(new Date(), 30), // (30 minutes)
        path: "/",
      });

      // refresh token 7 days expires
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addDays(new Date(), 7), // (7 days)
        path: "/",
      });

      // return the response
      return res.status(200).json({
        success: success,
        message: message,
        data: null,
      });
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
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // cross-site cookie
        expires: addMinutes(new Date(), 30), // (30 minutes)
        path: "/",
      });

      // send the new refresh token cookie
      res.cookie("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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

  resetPasswordRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const payload = req.validated!.body as ResetRequestDto;
      // grab and check the email
      const { email } = payload;
      if (!email) throw new HttpError(400, "Email required");

      // reset password request
      const result = await this.authUserService.resetRequest(email);

      // make tempporary cookie for set new password
      res.cookie("next_step", 69, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: addYears(new Date(), 1),
        path: "/",
      });

      // make the temporary jwt to verify the user
      res.cookie("temp_jwt", result.tempJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: addYears(new Date(), 1),
        path: "/",
      });

      // return the response
      return res.status(200).json({
        success: result.success,
        message: result.message,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  setResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the decoded jwt from middleware
      const { temp_jwt, next_step } = req;
      // check if the token is missing
      if (!temp_jwt || !next_step) {
        throw new HttpError(
          401,
          "Unauthorized, verify your reset password link first at your email",
        );
      }

      // get the email and password
      const payload = req.validated!.body as ResetConfirmDto;
      const { email, password, token } = payload;

      // check if the email valid and match with jwt email
      const jwt_email = temp_jwt.email!;
      if (email !== jwt_email) {
        throw new HttpError(401, "Unauthorized, email not match");
      }

      // set the new password
      const result = await this.authUserService.resetPassword(
        jwt_email,
        email,
        token,
        password,
      );

      // clear all unused temp cookie
      res.clearCookie("temp_jwt");
      res.clearCookie("next_step");

      // return the response
      return res.status(200).json({
        success: true,
        message: "Password reset successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  fetchMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the decoded userid from middleware
      const id = req.access_token?.sub || req.user?.id;
      if (!id) throw new HttpError(401, "Unauthorized, login first");

      // get the user by id
      const { message, success, user } = await this.authUserService.fetchMe(id);
      if (!user) throw new HttpError(404, "User not found");

      return res.status(200).json({
        success: success,
        message: message,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get the decoded userid from middleware
      const id = req.access_token?.sub || req.user?.id;
      if (!id) throw new HttpError(401, "Unauthorized, login first");

      // get the data from body
      const payload = req.validated!.body as UpdateMeDto;
      const data = payload;

      // update the user
      const updatedUser = await this.authUserService.updateMe(id, data);

      // return the response
      return res.status(200).json({
        success: true,
        message: "User updated",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  emailChangeRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the decoded userid from middleware
      const id = req.access_token?.sub;
      if (!id) throw new HttpError(401, "Unauthorized, login first");

      // get the new email from body
      const payload = req.validated!.body as EmailChangeRequestDto;
      if (!payload) throw new HttpError(400, "Email required");
      const { email } = payload;
      if (!email) throw new HttpError(400, "Email required");

      // request the new email chacnge
      const { tempJwt, success, message } =
        await this.authUserService.emailRequestChange(id, email);

      // temp log
      console.log(tempJwt, success, message);
      // make temp next step cookie
      res.cookie("next_step", 67, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: addYears(new Date(), 1),
        path: "/",
      });

      // set the temp_jwt cookie to verify real user
      res.cookie("temp_jwt", tempJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        expires: addYears(new Date(), 1),
        path: "/",
      });

      return res.status(200).json({
        success: success,
        message: message,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  setNewEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      //get the decoded temp_jwt from middleware
      const { temp_jwt, access_token } = req;
      if (!temp_jwt)
        throw new HttpError(
          401,
          "Unauthorized, verify your new email link first at your email",
        );
      if (!access_token) throw new HttpError(401, "Unauthorized, login first");

      // get the email and password
      const payload = req.validated!.body as EmailChangeConfirmDto;
      const { email, token } = req.body;
      const jwt_email = temp_jwt.email!;
      const newEmail = email;
      const oldEmail = access_token.email!;

      // check if the email valid and match with jwt email
      if (!email) throw new HttpError(400, "Email required");
      if (!token) throw new HttpError(400, "Token required");
      if (newEmail !== jwt_email)
        throw new HttpError(401, "Unauthorized, email not matched");

      // set the new email
      const result = await this.authUserService.setNewEmail(
        jwt_email,
        newEmail,
        oldEmail,
        token,
      );

      // reset cookies
      res.clearCookie("temp_jwt");
      res.clearCookie("next_step");
      res.clearCookie("access_token");
      res.clearCookie("refresh_token");

      return res.status(200).json({
        success: true,
        message: "Email updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
