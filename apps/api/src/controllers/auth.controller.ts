import type { Request, Response } from "express";

export class AuthController {
  // If you need custom endpoints later (profile, session, logout)
  static async example(_req: Request, res: Response) {
    res.json({ message: "Auth controller placeholder" });
  }
}
