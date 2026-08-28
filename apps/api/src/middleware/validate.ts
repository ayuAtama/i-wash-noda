// src/middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodError, ZodType } from "zod";

type Schema = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

type Source = "body" | "params" | "query";

type FieldIssue = {
  field: string;
  message: string;
  code: ZodError["issues"][number]["code"];
  expected?: unknown;
  received?: unknown;
};

function formatIssues(issues: ZodError["issues"]): FieldIssue[] {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.map(String).join(".") : "_root",
    message: issue.message,
    code: issue.code,
    expected: "expected" in issue ? issue.expected : undefined,
    received: "received" in issue ? issue.received : undefined,
  }));
}

export class Validator {
  static validate({ body, params, query }: Schema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const validated: NonNullable<Request["validated"]> = {};
      req.validated = validated;

      const checks: Array<{ source: Source; schema: ZodType; value: unknown }> =
        [];
      if (body) checks.push({ source: "body", schema: body, value: req.body ?? {} });
      if (params)
        checks.push({ source: "params", schema: params, value: req.params });
      if (query) checks.push({ source: "query", schema: query, value: req.query });

      const errors: Partial<Record<Source, FieldIssue[]>> = {};

      for (const check of checks) {
        const result = check.schema.safeParse(check.value);
        if (!result.success) {
          errors[check.source] = formatIssues(result.error.issues);
        } else {
          validated[check.source] = result.data;
        }
      }

      if (Object.keys(errors).length === 0) {
        return next();
      }

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        data: errors,
      });
    };
  }
}
