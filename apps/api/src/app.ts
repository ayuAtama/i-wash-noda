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
import adminOrderRoutes from "./routes/adminOrder.routes";
import cloudinaryRoutes from "./routes/cloudinary.routes";
import OutletRoute from "./routes/outlet.routes";
import ItemRoute from "./routes/item.routes";
import { socketService } from "@/socket";

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
    this.initializeAdminManageUserRoutes();
    this.initializeOutletRoutes();
    this.initializeItemRoutes();
    this.initializeAddressRoutes();
    this.initializePickupRoutes();
    this.initializeOrderRoutes();
    this.initializePreSignedURLRoutes();
    this.initializeTestBroadcast();
    this.initializeRoutes();
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
    this.app.use("/api/auth", authRoutes);
  }

  private initializeUserAndAuth() {
    this.app.use("/api/users", userRoutes); //  deprecated and testing only
    this.app.use("/api", authUserRoutes); // user for jwt
  }

  private initializeAdminManageUserRoutes() {
    this.app.use("/api/admin", adminRoutes);
  }

  private initializeAddressRoutes() {
    this.app.use("/api", AddressRoute);
  }

  private initializeAdminRoutes() {
    this.app.use("/api/admin/schedule", workerShiftRoutes); // on project
  }

  private initializePickupRoutes() {
    this.app.use("/api/", pickupRequestRoutes);
    this.app.use("/api/", pickupOrderRoutes);
  }

  private initializeRoutes() {
    //this.app.use("/api", OutletItemRoute);
    this.app.use("/api", adminOrderRoutes);
  }

  private initializeOrderRoutes() {
    this.app.use("/api/admin/orders", adminOrderRoutes);
  }

  private initializeOutletRoutes() {
    this.app.use("/api/outlets", OutletRoute);
  }

  private initializeItemRoutes() {
    this.app.use("/api/items", ItemRoute);
  }

  private initializeSwagger() {
    this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  private initializePreSignedURLRoutes() {
    this.app.use("/api", cloudinaryRoutes);
  }

  private initializeTestBroadcast() {
    this.app.post("/api/test/broadcast", (req, res) => {
      const { eventName, data } = req.query;
      const name = (eventName as string) || "test";
      const payload = (data as string) || "hello from test endpoint";
      socketService.broadcast(name, payload);
      res.json({ success: true, event: name, data: payload });
    });

    this.app.post("/api/test/broadcast/role", (req, res) => {
      const { role, eventName, data } = req.query;
      if (!role) {
        return res
          .status(400)
          .json({ success: false, message: "role is required" });
      }
      const name = (eventName as string) || "test";
      const payload = (data as string) || "hello from test endpoint";
      socketService.broadcastToRole(role as string, name, payload);
      res.json({ success: true, role, event: name, data: payload });
    });

    this.app.post("/api/test/broadcast/user", (req, res) => {
      const { userId, eventName, data } = req.query;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "userId is required" });
      }
      const name = (eventName as string) || "test";
      const payload = (data as string) || "hello from test endpoint";
      socketService.broadcastToUser(userId as string, name, payload);
      res.json({ success: true, userId, event: name, data: payload });
    });
  }

  private initializeErrorHandler() {
    // GLOBAL ERROR HANDLER MUST BE LAST
    this.app.use(errorHandler);
  }

  // for server start (optional) (express only)
  // public listen(port: number) {
  //   this.app.listen(port, () => {
  //     console.log(`🚀 Server running on http://localhost:${port}`);
  //     console.log(`📚 API Docs at http://localhost:${port}/docs`);

  //     console.log("\n=== Registered Endpoints ===");
  //     console.log(listEndpoints(this.app));
  //     console.log("===========================\n");
  //   });
  // }
}
