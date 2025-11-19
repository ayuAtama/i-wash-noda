// apps/api/src/validations/user.validation.ts
import { z } from "zod";
// Optional but good for TS meta typings:
import "zod-openapi";

export class UserValidation {
  static CreateUserSchema = z
    .object({
      name: z.string().min(2).meta({
        description: "User name",
        example: "John Doe",
      }),
      email: z.email().meta({
        description: "User email",
        example: "john@example.com",
      }),
    })
    .meta({
      id: "CreateUser",
      description: "Payload for creating a user",
      example: {
        name: "John Doe",
        email: "john@example.com",
      },
    });

  static UpdateUserSchema = z
    .object({
      name: z.string().min(2).optional().meta({
        description: "Updated user name",
        example: "John Updated",
      }),
      email: z.email().optional().meta({
        description: "Updated user email",
        example: "updated@example.com",
      }),
    })
    .meta({
      id: "UpdateUser",
      description: "Payload for updating a user",
    });
}

export type CreateUserDto = z.infer<typeof UserValidation.CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UserValidation.UpdateUserSchema>;
