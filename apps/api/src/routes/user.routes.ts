//src/routes/user.routes.ts
import { Router } from "express";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";
import { Validator } from "../middleware/validate";
import { UserValidation } from "../validations/user.validation";

export class UserRoute {
  public router = Router();
  private controller: UserController;

  constructor() {
    this.controller = new UserController(new UserService());
    this.register();
  }

  private register() {
    this.router.get("/", this.controller.getAll);
    this.router.get("/:id", this.controller.getById);

    this.router.post(
      "/",
      Validator.validate(UserValidation.CreateUserSchema),
      this.controller.create
    );

    this.router.put(
      "/:id",
      Validator.validate(UserValidation.UpdateUserSchema),
      this.controller.update
    );

    this.router.delete("/:id", this.controller.delete);
  }
}

export default new UserRoute().router;
