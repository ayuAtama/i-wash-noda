import { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils/httpError";
import { isUserRole } from "@/types/role";

/**
 * Authorization middleware
 * @param allowedRoles - roles that are allowed to access the route
 * super_admin, outlet_admin, worker, driver
 */
export function authorizationMiddleware(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Extract role from either auth strategy
      const role = req.access_token?.role ?? req.user?.role;

      if (!role) {
        throw new HttpError(401, "Unauthorized");
      }

      // Ensure role is valid
      if (!isUserRole(role)) {
        throw new HttpError(403, "Invalid role");
      }

      // Check authorization
      if (!allowedRoles.includes(role)) {
        throw new HttpError(
          403,
          "Forbidden, only " + allowedRoles.join(", ") + "'re allowed"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
