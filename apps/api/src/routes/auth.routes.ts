// import { Router } from "express";
// import { BetterAuthMiddleware } from "../utils/betterAuth";

// const router = Router();

// // Better Auth handles everything for /api/auth/*
// router.all(betterAuthMiddleware.handler());

// // If you want custom endpoints later:
// // router.get("/profile", AuthController.profile);

// export default router;

// src/routes/auth.routes.ts
import { Router } from "express";
import { betterAuthMiddleware } from "../utils/betterAuth";

export class AuthRoute {
  public router = Router();

  constructor() {
    // handle ALL /api/auth/* requests
    this.router.all("/*splat", betterAuthMiddleware.handler());
  }
}

export default new AuthRoute().router;
