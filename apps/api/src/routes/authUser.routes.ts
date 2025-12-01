// src/routes/authUser.routes.ts
import { Router } from "express";
import { AuthUserService } from "../services/authUser";
import { AuthUserController } from "../controllers/authUser.controller";

export class AuthUserRoute {
  public router = Router();
  private controller: AuthUserController;

  constructor() {
    this.controller = new AuthUserController(new AuthUserService());
    this.service();
  }

  private service() {
    this.router.post("/register", this.controller.register);
  }
}

export default new AuthUserRoute().router;
