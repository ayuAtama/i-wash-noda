import "express";

declare module "express" {
  interface Request {
    temp_jwt?: import("jose").JWTPayload & {
      email?: string;
    };
    next_step?: {
      next_step: number;
    };
  }
}
