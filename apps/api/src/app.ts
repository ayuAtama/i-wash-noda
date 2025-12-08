// src/app.ts
import express from "express";
import type { Application } from "express";
import swaggerUi from "swagger-ui-express";

import userRoutes from "@/routes/user.routes";
import { openApiDocument } from "@/docs/swagger";
import { errorHandler } from "@/middleware/error-handler";
import authRoutes from "@/routes/auth.routes";

import listEndpoints from "express-list-endpoints";
import cors from "cors";
import "dotenv/config";
import authUserRoutes from "@/routes/authUser.routes";

import cookieParser from "cookie-parser";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeCors();
    this.initializeAuth();
    this.initializeMiddlewares();
    this.initializeUserAndAuth();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandler();
  }

  private initializeCors() {
    this.app.use(
      cors({
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001/",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    );
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  private initializeAuth() {
    this.app.use("/api/auth", authRoutes);
  }

  private initializeUserAndAuth() {
    this.app.use("/api", authUserRoutes);
  }

  private initializeRoutes() {
    this.app.use("/users", userRoutes);
    //better-auth endpoints
    // this.app.use("/api/auth", authRoutes);
  }

  private initializeSwagger() {
    this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  private initializeErrorHandler() {
    // GLOBAL ERROR HANDLER MUST BE LAST
    this.app.use(errorHandler);
  }

  // for server start (optional)
  public listen(port: number) {
    this.app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);

      console.log("\n=== Registered Endpoints ===");
      console.log(listEndpoints(this.app));
      console.log("===========================\n");
    });
  }
}

//export default new App().app;
