import { prisma } from "@/config/prisma";
import { Request, Response, NextFunction } from "express";
import { UserRoleValidator } from "@/types/role";
import { WorkerStation } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";

export class ResolveContext {
  static async handler(req: Request, _res: Response, next: NextFunction) {
    try {
      // get the user id and role from the request
      const userId = req.access_token?.sub ?? req.user?.id;
      const role = req.access_token?.role ?? req.user?.role;
      if (!UserRoleValidator.isUserRole(role))
        throw new Error("Invalid user role");

      // get the outlet id
      const { outlet_id, worker_station } = await prisma.user.findFirstOrThrow({
        where: {
          id: userId,
          role: role,
        },
        select: { outlet_id: true, worker_station: true },
      });

      // For super_admin without an assigned outlet, accept outlet_id from query or body
      let resolvedOutletId = outlet_id;
      if (!resolvedOutletId && role === "super_admin") {
        resolvedOutletId =
          (req.query.outlet_id as string) ??
          (req.body?.outlet_id as string) ??
          (req.context?.outlet_id as string);
      }
      if (!resolvedOutletId) throw new HttpError(400, "Outlet not found");

      const context: {
        outlet_id: string;
        worker_station?: WorkerStation;
      } = {
        outlet_id: String(resolvedOutletId), // assign outlet_id
      };
      // checek role if worker
      if (role === "worker") {
        if (!worker_station) {
          throw new HttpError(403, "You are not a worker");
        }
        context.worker_station = worker_station; // assign worker_station
      }

      // return to req.context
      req.context = context;

      return next();
    } catch (error) {
      next(error);
    }
  }
}
