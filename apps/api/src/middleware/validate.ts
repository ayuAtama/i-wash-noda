// src/middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import { z, type ZodType } from "zod";

// export class Validator {
//   static validate(schema: ZodType) {
//     return (req: Request, res: Response, next: NextFunction) => {
//       const result = schema.safeParse(req.body);

//       if (!result.success) {
//         return res.status(400).json({
//           message: "Validation failed",
//           //errors: result.error,
//           //errors: z.treeifyError(result.error),
//           errors: result.error.issues,
//         });
//       }

//       req.body = result.data; // attach parsed payload

//       next();
//     };
//   }
// }

type Schema = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export class Validator {
  static validate({ body, params, query }: Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
      req.validated = {};

      if (body) {
        const result = body.safeParse(req.body ?? {});
        // return the validation error
        if (!result.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues[0].message,
          });
        }
        req.validated.body = result.data;
      }

      if (params) {
        const result = params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues[0].message,
          });
        }
        req.validated.params = result.data;
      }

      if (query) {
        const result = query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues[0].message,
          });
        }
        req.validated.query = result.data;
      }

      next();
    };
  }
}
