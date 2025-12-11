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
} from "@/middleware/rateLimitter";
import { authenticationMiddleware } from "@/middleware/authentication";

export class AuthUserRoute {
  public router = Router();
  private controller: AuthUserController;

  constructor() {
    this.controller = new AuthUserController(new AuthUserService());
    this.register();
    this.logout();
  }

  private register() {
    this.router.post(
      "/register",
      registerEndpointRateLimiter,
      this.controller.register
    );
    this.router.post(
      "/verify",
      verifyOTPEndpointRateLimiter,
      requireStep(1),
      this.controller.verify
    );
    this.router.post(
      "/complete-register",
      commpleteRegisterEndpointRateLimiter,
      requireStep(2),
      this.controller.completeRegistration
    );
    this.router.post(
      "/resend",
      resendOTPEndpointRateLimiter,
      this.controller.resendVerification
    );
  }

  private logout() {
    this.router.get(
      "/logout",
      authenticationMiddleware,
      this.controller.logout
    );
  }
}

export default new AuthUserRoute().router;
