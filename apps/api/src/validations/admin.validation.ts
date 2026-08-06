import { z } from "zod";
import "zod-openapi";

export class AdminValidation {
  static RegisterInternalUserSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "staff@example.com",
      }),
      role: z
        .enum(["super_admin", "outlet_admin", "driver", "customer", "worker"])
        .meta({
          description: "User role",
          example: "driver",
        }),
      outlet_id: z.uuid().meta({
        description: "Outlet ID (required for driver, outlet_admin)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      worker_station: z
        .enum(["washing", "ironing", "packing"])
        .optional()
        .meta({
          description: "Worker station (required when role is worker)",
          example: "washing",
        }),
    })
    .meta({
      id: "RegisterInternalUser",
      description: "Payload for registering an internal user",
      example: {
        email: "staff@example.com",
        role: "worker",
        outlet_id: "123e4567-e89b-12d3-a456-426614174000",
        worker_station: "washing",
      },
    });

  static ChangeRoleSchema = z
    .object({
      userId: z.uuid().meta({
        description: "UUID of the user to change role",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      role: z
        .enum(["super_admin", "outlet_admin", "driver", "customer", "worker"])
        .meta({
          description: "User role",
          example: "driver",
        }),
    })
    .meta({
      id: "ChangeRole",
      description: "Payload for changing user role",
      example: {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        role: "outlet_admin",
      },
    });

  static RemoveUserSchema = z
    .object({
      userId: z.uuid().meta({
        description: "UUID of the user to remove",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "RemoveUser",
      description: "Payload for removing a user",
      example: {
        userId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static UserIdParamSchema = z
    .object({
      userId: z.uuid().meta({
        description: "UUID of the user",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "UserIdParam",
      description: "Payload for identifying a user by ID",
      example: {
        userId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });
}

export type RegisterInternalUserDto = z.infer<
  typeof AdminValidation.RegisterInternalUserSchema
>;
export type ChangeRoleDto = z.infer<typeof AdminValidation.ChangeRoleSchema>;
export type RemoveUserDto = z.infer<typeof AdminValidation.RemoveUserSchema>;
export type UserIdParamDto = z.infer<typeof AdminValidation.UserIdParamSchema>;
