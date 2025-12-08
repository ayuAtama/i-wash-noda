// src/routes/authUser.routes.ts
import { Router } from "express";
import { AuthUserService } from "../services/authUser.services";
import { AuthUserController } from "../controllers/authUser.controller";
import { requireAuth } from "@/middleware/completeRegistration";

export class AuthUserRoute {
  public router = Router();
  private controller: AuthUserController;

  constructor() {
    this.controller = new AuthUserController(new AuthUserService());
    this.service();
  }

  private service() {
    this.router.post("/register", this.controller.register);
    this.router.post("/verify", this.controller.verify);
    this.router.post(
      "/complete-register",
      requireAuth,
      this.controller.completeRegistration
    );
  }
}

export default new AuthUserRoute().router;
