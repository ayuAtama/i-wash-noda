import { Router } from "express";
import { AdminController } from "@/controllers/admin.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { AdminValidation } from "@/validations/admin.validation";
import { AdminService } from "@/services/admin.services";

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
      Validator.validate({
        body: AdminValidation.RegisterInternalUserSchema,
      }),
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
      Validator.validate({
        body: AdminValidation.ChangeRoleSchema,
      }),
      this.controller.changeRole,
    );

    this.router.delete(
      "/users/:userId",
      authenticationMiddleware,
      authorizationMiddleware("super_admin", "outlet_admin"),
      Validator.validate({
        params: AdminValidation.RemoveUserSchema,
      }),
      this.controller.removeUser,
    );
  }
}

export default new AdminRoute().router;
