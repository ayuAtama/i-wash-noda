import { prisma } from "@/config/prisma";
import { Request, Response, NextFunction } from "express";
import { isUserRole } from "@/types/role";

export async function resolveContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // get the user id and role from the request
    const userId = req.access_token?.sub ?? req.user?.id;
    const role = req.access_token?.role ?? req.user?.role;
    if (!isUserRole(role)) throw new Error("Invalid user role");

    // get the outlet id
    const { outlet_id } = await prisma.user.findFirstOrThrow({
      where: {
        id: userId,
        role: role,
      },
    });
    if (!outlet_id) throw new Error("Outlet not found");

    // store the outlet id into req.context (express)
    req.context = {
      outlet_id: String(outlet_id),
    };

    return next();
  } catch (error) {
    next(error);
  }
}
