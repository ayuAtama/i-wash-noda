// src/routes/authUser.routes.ts
import { Router } from "express";
import { AuthUserService } from "../services/authUser.services";
import { AuthUserController } from "../controllers/authUser.controller";
import { requireStep } from "@/middleware/requireStep";
import {
  registerEndpointRateLimiter,
  verifyOTPEndpointRateLimiter,
  resendOTPEndpointRateLimiter,
  commpleteRegisterEndpointRateLimiter,
  loginEndpointRateLimiter,
} from "@/middleware/rateLimitter";
import { authenticationMiddleware } from "@/middleware/authentication";
import { refreshTokenMiddleware } from "@/middleware/refreshToken";

export class AuthUserRoute {
  public router = Router();
  private controller: AuthUserController;

  constructor() {
    this.controller = new AuthUserController(new AuthUserService());
    this.register();
    this.login();
    this.logout();
    this.refresh();
    this.resetPassword();
    this.userData();
  }

  private register() {
    this.router.post(
      "/register",
      registerEndpointRateLimiter,
      this.controller.register,
    );
    this.router.post(
      "/verify",
      verifyOTPEndpointRateLimiter,
      requireStep(1),
      this.controller.verify,
    );
    this.router.post(
      "/complete-register",
      commpleteRegisterEndpointRateLimiter,
      requireStep(2),
      this.controller.completeRegistration,
    );
    this.router.post(
      "/resend",
      resendOTPEndpointRateLimiter,
      this.controller.resendVerification,
    );
  }

  private logout() {
    this.router.get(
      "/logout",
      authenticationMiddleware,
      this.controller.logout,
    );
  }

  private login() {
    this.router.post("/login", loginEndpointRateLimiter, this.controller.login);
  }

  private refresh() {
    this.router.get(
      "/refresh",
      refreshTokenMiddleware,
      this.controller.refresh,
    );
  }

  private resetPassword() {
    this.router.post("/reset-request", this.controller.resetPasswordRequest);
    this.router.post(
      "/reset-confirm",
      requireStep(69),
      this.controller.setResetPassword,
    );
  }

  private userData() {
    this.router.get("/me", authenticationMiddleware, this.controller.fetchMe);
    this.router.put("/me", authenticationMiddleware, this.controller.updateMe);
    this.router.post(
      "/change-email-request",
      authenticationMiddleware,
      this.controller.emailChangeRequest,
    );
    this.router.put(
      "/change-email",
      requireStep(67),
      authenticationMiddleware,
      this.controller.setNewEmail,
    );
  }
}

export default new AuthUserRoute().router;
