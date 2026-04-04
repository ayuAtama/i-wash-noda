// /src/controllers/user.controller.ts
import type { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  // constructor(private userService: UserService) {}
  // or
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  //or (not rebase?)
  // private userService = new UserService();
  // constructor() {
  //   this.userService = new UserService(); // controller creates its own service
  // }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.userService.getAll();
      res.json({
        success: true,
        message: "Users fetched successfully",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id); //uuid string
      const user = await this.userService.getById(id);

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      res.json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await this.userService.create(req.body);
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: created,
      });
    } catch (err) {
      next(err); // <-- REQUIRED so error handler can catch it
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      const payload = req.body;
      const updated = await this.userService.update(id, payload);
      res.json({
        success: true,
        message: "User updated successfully",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = String(req.params.id);
      await this.userService.delete(id);
      res.json({
        success: true,
        message: "User deleted successfully",
        data: null,
      });
    } catch (err) {
      next(err);
    }
  };
}
