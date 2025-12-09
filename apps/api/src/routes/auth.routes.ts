// import { Router } from "express";
// import { BetterAuthMiddleware } from "../utils/betterAuth";

// const router = Router();

// // Better Auth handles everything for /api/auth/*
// router.all(BetterAuthMiddleware.handler());

// // If you want custom endpoints later:
// // router.get("/profile", AuthController.profile);

// export default router;

// src/routes/auth.routes.ts
import { Router } from "express";
import { BetterAuthMiddleware } from "../utils/betterAuth";

const router = Router();

// handle ALL /api/auth/* requests
router.all("/*splat", BetterAuthMiddleware.handler());

export default router;
