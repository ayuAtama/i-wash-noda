import { prisma } from "@/config/prisma";
import { Request, Response, NextFunction } from "express";
import { isUserRole } from "@/types/role";
import { WorkerStation } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";

export async function resolveContext(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    // get the user id and role from the request
    const userId = req.access_token?.sub ?? req.user?.id;
    const role = req.access_token?.role ?? req.user?.role;
    if (!isUserRole(role)) throw new Error("Invalid user role");

    // get the outlet id
    const { outlet_id, worker_station } = await prisma.user.findFirstOrThrow({
      where: {
        id: userId,
        role: role,
      },
      select: { outlet_id: true, worker_station: true },
    });
    if (!outlet_id) throw new HttpError(400, "Outlet not found");

    // store the outlet id into req.context (express)
    // req.context = {
    //   outlet_id: String(outlet_id),
    //   ...(worker_station && { worker_station }), // optional
    // };

    const context: {
      outlet_id: string;
      worker_station?: WorkerStation;
    } = {
      outlet_id: String(outlet_id), // assign outlet_id
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
