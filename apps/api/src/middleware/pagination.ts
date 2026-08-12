import { Request, Response, NextFunction } from "express";
import { HttpError } from "@/utils/httpError";

export class Pagination {
  static handler(req: Request, _res: Response, next: NextFunction) {
    try {
      // what's the point if there's no page or limit
      if (!req.query.page || !req.query.limit)
        return next(new HttpError(400, "Missing page or limit"));
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      req.pagination = { page, limit, skip };
      next();
    } catch (error) {
      next(error);
    }
  }
}
