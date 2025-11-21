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
      res.json(users);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const user = await this.userService.getById(id);

      if (!user) return res.status(404).json({ message: "User not found" });

      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const created = await this.userService.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err); // <-- REQUIRED so error handler can catch it
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const updated = await this.userService.update(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      await this.userService.delete(id);
      res.json({ message: "User deleted" });
    } catch (err) {
      next(err);
    }
  };
}
