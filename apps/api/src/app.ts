// src/app.ts
import express, { Application } from "express";
//middleware
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "@/docs/swagger";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "@/middleware/error-handler";
//route
import authRoutes from "@/routes/auth.routes";
import userRoutes from "@/routes/user.routes";
import authUserRoutes from "@/routes/authUser.routes";
import adminRoutes from "@/routes/admin.routes";
import AddressRoute from "@/routes/address.routes";
import OutletItemRoute from "@/routes/outletItem.routes";
import workerShiftRoutes from "@/routes/workerShift.routes";
import pickupRequestRoutes from "./routes/pickupRequest.routes";
import pickupOrderRoutes from "./routes/pickupOrder.routes";
import adminOrderRoutes from "./routes/adminOrder.routes";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeCors();
    this.initializeBetterAuth();
    this.initializeMiddlewares();
    this.initializeAdminRoutes();
    this.initializeUserAndAuth();
    this.initializeAdminManageUserRoutes();
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
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      }),
    );
  }

  private initializeMiddlewares() {
    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(cookieParser());
  }

  private initializeBetterAuth() {
    this.app.use("/api/auth", authRoutes);
  }

  private initializeUserAndAuth() {
    this.app.use("/api/users", userRoutes); //  deprecated and testing only
    this.app.use("/api", authUserRoutes);
  }

  private initializeAdminManageUserRoutes() {
    this.app.use("/api/admin", adminRoutes);
  }

  private initializeAddressRoutes() {
    this.app.use("/api", AddressRoute);
  }

  private initializeAdminRoutes() {
    this.app.use("/api/admin", workerShiftRoutes); // test
  }

  private initializePickupRoutes() {
    this.app.use("/api/", pickupRequestRoutes);
    this.app.use("/api/", pickupOrderRoutes);
  }

  private initializeRoutes() {
    this.app.use("/api", OutletItemRoute);
    this.app.use("/api", adminOrderRoutes);
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
      console.log(`📚 API Docs at http://localhost:${port}/docs`);

      console.log("\n=== Registered Endpoints ===");
      console.log(listEndpoints(this.app));
      console.log("===========================\n");
    });
  }
}
