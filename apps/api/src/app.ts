// src/app.ts
import express, { Application, Router } from "express";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "@/docs/swagger";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { errorHandler } from "@/middleware/error-handler";
import { RouteRegistry } from "@/routes";

export class App {
  public app: Application;

  constructor(registry: RouteRegistry) {
    this.app = express();
    this.initializeHealthCheck();
    this.initializeCors();
    this.initializeMiddlewares();
    this.initializeRoutes(registry.getAll());
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

  private initializeRoutes(routes: { path: string; router: Router }[]) {
    routes.forEach(({ path, router }) => {
      this.app.use(path, router);
    });
  }

  private initializeSwagger() {
    this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  private initializeErrorHandler() {
    this.app.use(errorHandler);
  }

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
