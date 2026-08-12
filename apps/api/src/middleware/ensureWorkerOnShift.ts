import { prisma } from "@/config/prisma";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";
import { DateUtils } from "@/utils/today";

export class EnsureWorkerOnShift {
  static async handler(req: Request, _res: Response, next: NextFunction) {
    try {
      // get the user id from the request
      if (!req.access_token)
        throw new HttpError(500, "Please add authentication middleware first");
      const userId = req.access_token.sub;
      // bypass if super_admin and outlet_admin
      if (
        req.access_token.role === "super_admin" ||
        req.access_token.role === "outlet_admin"
      )
        return next();
      if (!userId)
        throw new HttpError(401, "Please add authentication middleware first");
      // get the outlet id from req.contex (need resolveContext middleware)
      if (!req.context)
        throw new HttpError(
          500,
          "Please add resolveContext middleware before proceed",
        );
      const { outlet_id } = req.context;
      if (!outlet_id) throw new HttpError(400, "Outlet not found");

      // check the current date/time
      const currentTime = new Date(
        Date.UTC(
          1970,
          0,
          1,
          DateUtils.now().getHours(),
          DateUtils.now().getMinutes(),
          0,
        ),
      ); // local time

      // fetch the result if valid it means on shift
      const shift = await prisma.workerShift.findFirst({
        where: {
          worker_id: userId,
          outlet_id,
          day_of_week: DateUtils.today(),
          start_time: {
            lte: currentTime,
          },
          end_time: {
            gte: currentTime,
          },
        },
        select: {
          id: true,
        },
      });

      if (!shift)
        throw new HttpError(403, "You're NOT on shift, please rest first");
      next();
    } catch (error) {
      next(error);
    }
  }
}
