// src/routes/authUser.routes.ts
import { Router } from "express";
import { AuthUserService } from "../services/authUser.services";
import { AuthUserController } from "../controllers/authUser.controller";
import { requireStep } from "@/middleware/requireStep";
import { RateLimiter } from "@/middleware/rateLimitter";
import { authenticationMiddleware } from "@/middleware/authentication";
import { refreshTokenMiddleware } from "@/middleware/refreshToken";
import { Validator } from "@/middleware/validate";
import { AuthValidation } from "@/validations/auth.validation";

export class AuthUserRoute {
  public router = Router();
  private controller: AuthUserController;

  constructor(controller: AuthUserController) {
    this.controller = controller;
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
      RateLimiter.create(10),
      Validator.validate({
        body: AuthValidation.RegisterSchema,
      }),
      this.controller.register,
    );
    this.router.post(
      "/verify",
      RateLimiter.create(5),
      Validator.validate({
        body: AuthValidation.VerifySchemaTokenBody,
        query: AuthValidation.VerifySchemaTokenParams,
      }),
      requireStep.handler(1),
      this.controller.verify,
    );
    this.router.post(
      "/complete-register",
      RateLimiter.create(3),
      Validator.validate({
        body: AuthValidation.CompleteRegisterSchema,
      }),
      requireStep.handler(2),
      this.controller.completeRegistration,
    );
    this.router.post(
      "/resend-otp",
      RateLimiter.create(3),
      Validator.validate({
        body: AuthValidation.ResendSchema,
      }),
      this.controller.resendVerification,
    );
  }

  private logout() {
    this.router.get(
      "/logout",
      authenticationMiddleware.handler,
      this.controller.logout,
    );
  }

  private login() {
    this.router.post(
      "/login",
      Validator.validate({
        body: AuthValidation.LoginSchema,
      }),
      this.controller.login,
    );
  }

  private refresh() {
    this.router.get(
      "/refresh",
      refreshTokenMiddleware.handler,
      this.controller.refresh,
    );
  }

  private resetPassword() {
    this.router.post(
      "/reset-password-request",
      Validator.validate({
        body: AuthValidation.ResetRequestSchema,
      }),
      this.controller.resetPasswordRequest,
    );
    this.router.post(
      "/reset-password-confirm",
      Validator.validate({
        body: AuthValidation.ResetConfirmSchema,
      }),
      requireStep.handler(69),
      this.controller.setResetPassword,
    );
  }

  private userData() {
    this.router.get("/me", authenticationMiddleware.handler, this.controller.fetchMe);
    this.router.put(
      "/me",
      authenticationMiddleware.handler,
      Validator.validate({
        body: AuthValidation.UpdateMeSchema,
      }),
      this.controller.updateMe,
    );
    this.router.post(
      "/change-email-request",
      authenticationMiddleware.handler,
      Validator.validate({
        body: AuthValidation.EmailChangeRequestSchema,
      }),
      this.controller.emailChangeRequest,
    );
    this.router.put(
      "/change-email-confirm",
      requireStep.handler(67),
      authenticationMiddleware.handler,
      Validator.validate({
        body: AuthValidation.EmailChangeConfirmSchema,
      }),
      this.controller.setNewEmail,
    );
  }
}

export default new AuthUserRoute(new AuthUserController(new AuthUserService()))
  .router;
