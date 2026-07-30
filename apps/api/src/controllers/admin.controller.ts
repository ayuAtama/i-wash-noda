// apps/api/src/services/admin.services.ts
import type { Request, Response, NextFunction } from "express";
import { AdminService } from "@/services/admin.services";
import { HttpError } from "@/utils/httpError";
import { isUserRole } from "@/types/role";
import {
  ChangeRoleDto,
  RegisterInternalUserDto,
  RemoveUserDto,
} from "@/validations/admin.validation";

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
      if (!req.validated) {
        throw new HttpError(400, "Missing email or role or outlet_id");
      }
      const { email, role, outlet_id } = req.validated
        .body as RegisterInternalUserDto;
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
          "Forbidden, only super_admin can create outlet_admin or super_admin",
        );
      }

      // create the user (outlet_id empty if role is super_admin)
      const payload = { email, role, outlet_id };
      const result = await this.adminService.registerInternalUser(payload);
      return res.status(201).json({
        success: true,
        message: `${result.role} User registered. Verification email sent.`,
        data: {
          role: result.role,
          emailVerified: result.emailVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getAllUser = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.adminService.getAllUser();
      return res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  changeRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.validated!.body as ChangeRoleDto;
      if (!userId || !role) {
        throw new HttpError(400, "Missing userId or role");
      }
      const result = await this.adminService.changeRole(userId, role);
      return res.status(200).json({
        success: true,
        message: "Role changed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  removeUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.validated!.params as RemoveUserDto;
      if (!userId) {
        throw new HttpError(400, "Missing userId");
      }
      const result = await this.adminService.deleteUser(userId);
      return res.status(200).json({
        success: true,
        message: "User removed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
