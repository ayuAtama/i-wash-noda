import "express";

declare module "express" {
  interface Request {
    temp_jwt?: import("jose").JWTPayload & {
      email?: string;
    };
    next_step?: {
      next_step: number;
    };
    access_token?: import("jose").JWTPayload & {
      sub?: string;
      email?: string;
      role?: string;
    };
    refresh_token?: import("jose").JWTPayload & {
      sub?: string;
      sid?: string;
    };
  }
}
