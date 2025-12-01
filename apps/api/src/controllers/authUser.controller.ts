// src/controllers/authUser.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AuthUserService } from "../services/authUser";
import { sendVerificationEmail } from "../utils/mail";

export class AuthUserController {
  private authUserService: AuthUserService;

  constructor(authUserService: AuthUserService) {
    this.authUserService = authUserService;
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // create user + token
      const {user, rawToken} = await this.authUserService.register(req.body);

      // send email 
      await sendVerificationEmail(user.email, rawToken);

      // return response
      return res.status(201).json({
        message: "User registered. Verification email sent.",
        user,
      });
    } catch (err) {
      next(err);
    }
  };
}
