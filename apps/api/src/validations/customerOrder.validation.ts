import { z } from "zod";
import "zod-openapi";

export class CustomerOrderValidation {
  static UserIdSchema = z
    .uuid()
    .meta({
      description: "User ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    })
    .meta({
      id: "UserId",
    });
}

export type UserIdDto = z.infer<typeof CustomerOrderValidation.UserIdSchema>;
