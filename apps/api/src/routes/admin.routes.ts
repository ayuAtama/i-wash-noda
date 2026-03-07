import { AdminController } from "@/controllers/admin.controller";
import { AdminService } from "@/services/admin.services";
import { Router } from "express";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";

export class AdminRoute {
  public router = Router();
  private controller: AdminController;

  constructor() {
    this.controller = new AdminController(new AdminService());
    this.createInternalUser();
    this.manageInternalUser();
  }

  private createInternalUser() {
    this.router.post(
      "/register",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      this.controller.register,
    );
  }

  private manageInternalUser() {
    this.router.get(
      "/users",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      this.controller.getAllUser,
    );

    this.router.put(
      "/users",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      this.controller.changeRole,
    );

    this.router.delete(
      "/users",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      this.controller.removeUser,
    );
  }
}

export default new AdminRoute().router;
