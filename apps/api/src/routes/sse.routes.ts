import { Router } from "express";
import { SSEController } from "@/controllers/sse.controller";
import { sseService } from "@/services/sse.services";
import { authenticationMiddleware } from "@/middleware/authentication";

export class SseRoute {
  public router = Router();
  private controller: SSEController;

  constructor() {
    this.controller = new SSEController(sseService);
    this.createRoutes();
  }

  private createRoutes() {
    this.router.get(
      "/",
      authenticationMiddleware.handler,
      this.controller.connect,
    );

    this.router.post("/", this.controller.sendData);

    // ── Test broadcast endpoints (no auth) ──
    this.router.post("/test/all", this.controller.testBroadcastAll);
    this.router.post("/test/role", this.controller.testBroadcastToRole);
    this.router.post("/test/outlet", this.controller.testBroadcastToOutlet);
    this.router.post("/test/user", this.controller.testBroadcastToUser);
    this.router.post("/test/roles", this.controller.testBroadcastToRoles);
    this.router.post("/test/exclude", this.controller.testBroadcastExceptUser);
  }
}

export default new SseRoute().router;
