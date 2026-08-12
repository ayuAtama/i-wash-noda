import { z } from "zod";
import "zod-openapi";

export class SetupValidation {
  static SetupSuperAdminSchema = z
    .object({
      email: z.email().meta({
        description: "Super admin email address",
        example: "admin@example.com",
      }),
      name: z.string().min(2).meta({
        description: "Super admin full name",
        example: "Super Admin",
      }),
      password: z.string().min(6).meta({
        description: "Super admin password (min 6 characters)",
        example: "securePassword123",
      }),
    })
    .meta({
      id: "SetupSuperAdmin",
      description: "Payload for setting up the first super admin",
      example: {
        email: "admin@example.com",
        name: "Super Admin",
        password: "securePassword123",
      },
    });
}

export type SetupSuperAdminDto = z.infer<
  typeof SetupValidation.SetupSuperAdminSchema
>;
