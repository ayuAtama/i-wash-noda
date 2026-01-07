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
import helmet from "helmet";
import AddressRoute from "@/routes/address.routes";
import OutletItemRoute from "@/routes/outletItem.routes";
import adminRoutes from "@/routes/admin.routes";
import workerShiftRoutes from "@/routes/workerShift.routes";
import pickupRequstRoutes from "./routes/pickupRequst.routes";
import pickupOrderRoutes from "./routes/pickupOrder.routes";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeCors();
    this.initializeAuth();
    this.initializeMiddlewares();
    this.initializeAdminRoutes();
    this.initializeUserAndAuth();
    this.initializeAddressRoutes();
    this.initializePickupRoutes();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandler();
  }

  private initializeCors() {
    this.app.use(
      cors({
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      })
    );
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  private initializeAuth() {
    this.app.use("/api/auth", authRoutes);
  }

  private initializeUserAndAuth() {
    this.app.use("/api", authUserRoutes);
  }

  private initializeAddressRoutes() {
    this.app.use("/api", AddressRoute);
  }

  private initializeAdminRoutes() {
    this.app.use("/api/admin", adminRoutes);
    this.app.use("/api/admin", workerShiftRoutes); // test
  }

  private initializePickupRoutes() {
    this.app.use("/api/", pickupRequstRoutes);
    this.app.use("/api/", pickupOrderRoutes);
  }

  private initializeRoutes() {
    this.app.use("/api", OutletItemRoute);
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
