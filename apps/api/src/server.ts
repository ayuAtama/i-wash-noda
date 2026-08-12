// src/server.ts
import { App } from "./app";
import { RouteRegistry } from "./routes";
import { CronService } from "./services/cron.services";

// auth
import authRoutes from "./routes/auth.routes";
import authUserRoutes from "./routes/authUser.routes";

// setup
import setupRoutes from "./routes/setup.routes";

// admin
import adminRoutes from "./routes/admin.routes";
import workerShiftRoutes from "./routes/workerShift.routes";
import adminMismatchRoutes from "./routes/adminMismatch.routes";
import adminOrderRoutes, {
  adminWalkInOrderRoutes,
} from "./routes/adminOrder.routes";

// outlet & item
import OutletRoute, { adminOutletRoutes } from "./routes/outlet.routes";
import ItemRoute from "./routes/item.routes";

// customer
import AddressRoute from "./routes/address.routes";
import customerOrderRoutes from "./routes/customerOrder.routes";
import pickupRequestRoutes from "./routes/pickupRequest.routes";

// driver
import pickupOrderRoutes from "./routes/pickupOrder.routes";
import workerStationRoutes from "./routes/workerStation.routes";
import deliveryOrderRoutes from "./routes/deliveryOrder.routes";

// infrastructure
import cloudinaryRoutes from "./routes/cloudinary.routes";
import midtransRoutes from "./routes/midtrans.routes";

export class Server {
  private app: App;
  private cronService: CronService;

  constructor() {
    this.cronService = new CronService();
    const registry = new RouteRegistry()
      .register("/api/auth", authRoutes)
      .register("/api", authUserRoutes)
      .register("/api/setup", setupRoutes)
      .register("/api/admin", adminRoutes)
      .register("/api/admin/schedule", workerShiftRoutes)
      .register("/api/admin/mismatch", adminMismatchRoutes)
      .register("/api/admin/orders", adminOrderRoutes)
      .register("/api/admin/walk-in-customer", adminWalkInOrderRoutes)
      .register("/api/admin/outlets", adminOutletRoutes)
      .register("/api/admin/items", ItemRoute)
      .register("/api/outlets", OutletRoute)
      .register("/api/addresses", AddressRoute)
      .register("/api/orders", customerOrderRoutes)
      .register("/api/pickup-requests", pickupRequestRoutes)
      .register("/api/pickup-requests", pickupOrderRoutes)
      .register("/api/workers", workerStationRoutes)
      .register("/api/driver/delivery-requests", deliveryOrderRoutes)
      .register("/api/signature", cloudinaryRoutes)
      .register("/api/midtrans", midtransRoutes);

    this.app = new App(registry);
  }

  public start(port: number): void {
    this.cronService.start();
    this.app.listen(port);
  }

  public getApp() {
    return this.app.app;
  }
}

import { fileURLToPath } from "url";

const isMainModule =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
  const server = new Server();
  server.start(PORT);
}
