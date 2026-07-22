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
import workerShiftRoutes from "@/routes/workerShift.routes";
import pickupRequestRoutes from "./routes/pickupRequest.routes";
import pickupOrderRoutes from "./routes/pickupOrder.routes";
import adminOrderRoutes, {
  adminWalkInOrderRoutes,
} from "./routes/adminOrder.routes";
import cloudinaryRoutes from "./routes/cloudinary.routes";
import OutletRoute, { adminOutletRoutes } from "./routes/outlet.routes";
import ItemRoute from "./routes/item.routes";
import workerStationRoutes from "./routes/workerStation.routes";
import adminMismatchRoutes from "./routes/adminMismatch.routes";
import customerOrderRoutes from "./routes/customerOrder.routes";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeHealthCheck();
    this.initializeCors();
    this.initializeBetterAuth();
    this.initializeMiddlewares();
    this.initializeAdminRoutes();
    this.initializeUserAndAuth();
    this.initializeUserOrderRoutes();
    this.initializeAdminManageUserRoutes();
    this.initializeOutletRoutes();
    this.initializeItemRoutes();
    this.initializeAddressRoutes();
    this.initializePickupRoutes();
    this.initializeOrderRoutes();
    this.initializeWorkerRoutes();
    this.initializePreSignedURLRoutes();
    this.initializeAdminMismatchRoutes();
    this.initializeSwagger();
    this.initializeErrorHandler();
  }

  private initializeHealthCheck() {
    this.app.get("/", (_req, res) => {
      res.status(200).json({
        success: true,
        message: "API is healthy",
        data: {
          timestamp: new Date().toISOString(),
        },
      });
    });
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
    //this.app.use("/api/auth", authRoutes);
  }

  private initializeUserAndAuth() {
    //this.app.use("/api/users", userRoutes); //  deprecated and testing only
    this.app.use("/api/auth", authRoutes); // user for better auth
    this.app.use("/api", authUserRoutes); // user for jwt (login/register/etc)
  }
  private initializeAddressRoutes() {
    this.app.use("/api/addresses", AddressRoute); // customer address
  }

  private initializeUserOrderRoutes() {
    this.app.use("/api/orders", customerOrderRoutes);
  }

  private initializeAdminManageUserRoutes() {
    this.app.use("/api/admin", adminRoutes); // register worker & driver and etc
  }

  private initializeAdminRoutes() {
    this.app.use("/api/admin/schedule", workerShiftRoutes); // admin
  }

  private initializePickupRoutes() {
    this.app.use("/api/pickup-requests", pickupRequestRoutes); // customer
    this.app.use("/api/pickup-requests", pickupOrderRoutes); // driver
  }

  private initializeWorkerRoutes() {
    this.app.use("/api/workers", workerStationRoutes);
  }

  private initializeOrderRoutes() {
    this.app.use("/api/admin/orders", adminOrderRoutes);
    this.app.use("/api/admin/walk-in-customer", adminWalkInOrderRoutes);
  }

  private initializeOutletRoutes() {
    this.app.use("/api/outlets", OutletRoute);
    this.app.use("/api/admin/outlets", adminOutletRoutes);
  }

  private initializeAdminMismatchRoutes() {
    this.app.use("/api/admin/mismatch", adminMismatchRoutes);
  }

  private initializeItemRoutes() {
    this.app.use("/api/admin/items", ItemRoute);
  }

  private initializePreSignedURLRoutes() {
    this.app.use("/api/signature", cloudinaryRoutes);
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
