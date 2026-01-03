// apps/api/src/services/admin.services.ts
import type { Request, Response, NextFunction } from "express";
import { AdminService } from "@/services/admin.services";
import { HttpError } from "@/utils/httpError";
import { isUserRole } from "@/types/role";

export class AdminController {
  private adminService: AdminService;

  constructor(adminService: AdminService) {
    this.adminService = adminService;
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // check what role
      const userRole = req.user?.role ?? req.access_token?.role;

      // destructre email, role, and outlet_id
      const { email, role, outlet_id } = req.body;
      //check if email or role is missing and validate the role
      if (!email || !role) {
        throw new HttpError(400, "Missing email or role");
      }
      if (!isUserRole(role)) {
        throw new HttpError(403, "Invalid role");
      }

      // only super_admin can create super_admin or outlet_admin account
      if (
        userRole !== "super_admin" &&
        (role === "super_admin" || role === "outlet_admin")
      ) {
        throw new HttpError(
          403,
          "Forbidden, only super_admin can create outlet_admin or super_admin"
        );
      }

      // create the user (outlet_id empty if role is super_admin)
      const payload = { email, role, outlet_id };
      const result = await this.adminService.registerInternalUser(payload);
      return res.status(201).json({
        message: `${result.role} User registered. Verification email sent.`,
        role: result.role,
        "email verified": result.emailVerified,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllUser = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getAllUser();
      return res.status(200).json({
        message: "User fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  changeRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.body;
      if (!userId || !role) {
        throw new HttpError(400, "Missing userId or role");
      }
      const result = await this.adminService.changeRole(userId, role);
      return res.status(200).json({
        message: "Role changed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        throw new HttpError(400, "Missing userId");
      }
      const result = await this.adminService.deleteUser(userId);
      return res.status(200).json({
        message: "User removed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
