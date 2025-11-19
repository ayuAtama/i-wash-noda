import type { Request, Response } from "express";
import { UserService } from "../services/user.service.js";

export const UserController = {
  getUsers: async (_req: Request, res: Response) => {
    const users = await UserService.getAll();
    res.json(users);
  },

  createUser: async (req: Request, res: Response) => {
    const { name, email } = req.body;

    const user = await UserService.create({ name, email });

    res.status(201).json(user);
  },
};
