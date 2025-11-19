import express from "express";
import type { Application } from "express";
import swaggerUi from "swagger-ui-express";

import userRoutes from "./routes/user.routes";
import { openApiDocument } from "./docs/swagger";
import { errorHandler } from "./middleware/error-handler";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeSwagger();
    this.initializeErrorHandler();
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
  }

  private initializeRoutes() {
    this.app.use("/users", userRoutes);
  }

  private initializeSeed() {
    this.app.use("/seed", userRoutes);
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
    });
  }
}

export default new App().app;
