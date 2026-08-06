import { Router } from "express";
import { AdminController } from "@/controllers/admin.controller";
import { authenticationMiddleware } from "@/middleware/authentication";
import { authorizationMiddleware } from "@/middleware/authorization";
import { Validator } from "@/middleware/validate";
import { AdminValidation } from "@/validations/admin.validation";
import { AdminService } from "@/services/admin.services";
import { PrismaWrapper } from "@/config/prisma";
import { PaginationSchema } from "@/validations/pagination.validation";


export class AdminRoute {
  public router = Router();
  private controller: AdminController;

  constructor(controller: AdminController) {
    this.controller = controller;
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
      Validator.validate({ query: PaginationSchema }),
      this.controller.getAllUser,
    );

    this.router.patch(
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

export default new AdminRoute(
  new AdminController(new AdminService(new PrismaWrapper())),
).router;
