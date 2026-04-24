// src/routes/authUser.routes.ts
import { Router } from "express";
import { AuthUserService } from "../services/authUser.services";
import { AuthUserController } from "../controllers/authUser.controller";
import { requireStep } from "@/middleware/requireStep";
import rateLimiter from "@/middleware/rateLimitter";
import { authenticationMiddleware } from "@/middleware/authentication";
import { refreshTokenMiddleware } from "@/middleware/refreshToken";
import { Validator } from "@/middleware/validate";
import { AuthValidation } from "@/validations/auth.validation";

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
      rateLimiter(10),
      Validator.validate({
        body: AuthValidation.RegisterSchema,
      }),
      this.controller.register,
    );
    this.router.post(
      "/verify",
      rateLimiter(5),
      Validator.validate({
        body: AuthValidation.VerifySchemaTokenBody,
        query: AuthValidation.VerifySchemaTokenParams,
      }),
      requireStep(1),
      this.controller.verify,
    );
    this.router.post(
      "/complete-register",
      rateLimiter(3),
      Validator.validate({
        body: AuthValidation.CompleteRegisterSchema,
      }),
      requireStep(2),
      this.controller.completeRegistration,
    );
    this.router.post(
      "/resend-otp",
      rateLimiter(3),
      Validator.validate({
        body: AuthValidation.ResendSchema,
      }),
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
      refreshTokenMiddleware,
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
      requireStep(69),
      this.controller.setResetPassword,
    );
  }

  private userData() {
    this.router.get("/me", authenticationMiddleware, this.controller.fetchMe);
    this.router.put(
      "/me",
      authenticationMiddleware,
      Validator.validate({
        body: AuthValidation.UpdateMeSchema,
      }),
      this.controller.updateMe,
    );
    this.router.post(
      "/change-email-request",
      authenticationMiddleware,
      Validator.validate({
        body: AuthValidation.EmailChangeRequestSchema,
      }),
      this.controller.emailChangeRequest,
    );
    this.router.put(
      "/change-email-confirm",
      requireStep(67),
      authenticationMiddleware,
      Validator.validate({
        body: AuthValidation.EmailChangeConfirmSchema,
      }),
      this.controller.setNewEmail,
    );
  }
}

export default new AuthUserRoute().router;
