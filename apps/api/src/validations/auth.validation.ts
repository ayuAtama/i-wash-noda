import { z } from "zod";
import "zod-openapi";

export class AuthValidation {
  static RegisterSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "user@example.com",
      }),
    })
    .meta({
      id: "Register",
      description: "Payload for registering a new user",
      example: {
        email: "user@example.com",
      },
    });

  static VerifySchemaTokenBody = z
    .object({
      token: z
        .string()
        .regex(/^\d{6}$/)
        .optional()
        .meta({
          description: "OTP verification token",
          example: "123456",
        }),
    })
    .meta({
      id: "VerifyTokenBody",
      description: "Payload for verifying email with OTP",
      example: {
        token: "123456",
      },
    });

  static VerifySchemaTokenParams = z
    .object({
      token: z.string().optional().meta({
        description: "OTP verification token using link",
        example:
          "17d620b2f137f4897b2882c530303a856cf27fe9ff9c8879065f8c135c9c55df",
      }),
    })
    .meta({
      id: "VerifyTokenParams",
      description: "Payload for verifying email with OTP",
      example: {
        token:
          "17d620b2f137f4897b2882c530303a856cf27fe9ff9c8879065f8c135c9c55df",
      },
    });

  static CompleteRegisterSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "user@example.com",
      }),
      name: z.string().min(2).meta({
        description: "User full name",
        example: "John Doe",
      }),
      password: z.string().min(6).meta({
        description: "User password (min 6 characters)",
        example: "securePassword123",
      }),
      phone: z.string().optional().meta({
        description: "User phone number",
        example: "+1234567890",
      }),
      role: z.string().optional().meta({
        description: "User role (default: customer)",
        example: "customer",
      }),
    })
    .meta({
      id: "CompleteRegister",
      description: "Payload for completing user registration",
      example: {
        email: "user@example.com",
        name: "John Doe",
        password: "securePassword123",
        phone: "+1234567890",
        role: "customer",
      },
    });

  static LoginSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "user@example.com",
      }),
      password: z.string().meta({
        description: "User password",
        example: "securePassword123",
      }),
    })
    .meta({
      id: "Login",
      description: "Payload for user login",
      example: {
        email: "user@example.com",
        password: "securePassword123",
      },
    });

  static ResendSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "user@example.com",
      }),
    })
    .meta({
      id: "Resend",
      description: "Payload for resending verification OTP",
      example: {
        email: "user@example.com",
      },
    });

  static ResetRequestSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "user@example.com",
      }),
    })
    .meta({
      id: "ResetRequest",
      description: "Payload for requesting password reset",
      example: {
        email: "user@example.com",
      },
    });

  static ResetConfirmSchema = z
    .object({
      email: z.email().meta({
        description: "User email address",
        example: "user@example.com",
      }),
      password: z.string().min(6).meta({
        description: "New password (min 6 characters)",
        example: "newSecurePassword123",
      }),
      token: z.string().meta({
        description: "Password reset token",
        example: "123456",
      }),
    })
    .meta({
      id: "ResetConfirm",
      description: "Payload for confirming password reset",
      example: {
        email: "user@example.com",
        password: "newSecurePassword123",
        token: "123456",
      },
    });

  static UpdateMeSchema = z
    .object({
      name: z.string().min(2).optional().meta({
        description: "User full name",
        example: "John Updated",
      }),
      phone: z.string().optional().meta({
        description: "User phone number",
        example: "+1987654321",
      }),
    })
    .meta({
      id: "UpdateMe",
      description: "Payload for updating current user",
      example: {
        name: "John Updated",
        phone: "+1987654321",
      },
    });

  static EmailChangeRequestSchema = z
    .object({
      email: z.email().meta({
        description: "New email address",
        example: "newemail@example.com",
      }),
    })
    .meta({
      id: "EmailChangeRequest",
      description: "Payload for requesting email change",
      example: {
        email: "newemail@example.com",
      },
    });

  static EmailChangeConfirmSchema = z
    .object({
      email: z.email().meta({
        description: "New email address",
        example: "newemail@example.com",
      }),
      token: z.string().meta({
        description: "Email change verification token",
        example: "123456",
      }),
    })
    .meta({
      id: "EmailChangeConfirm",
      description: "Payload for confirming email change",
      example: {
        email: "newemail@example.com",
        token: "123456",
      },
    });
}

export type RegisterDto = z.infer<typeof AuthValidation.RegisterSchema>;
export type VerifyDtoBody = z.infer<
  typeof AuthValidation.VerifySchemaTokenBody
>;
export type VerifyDtoParams = z.infer<
  typeof AuthValidation.VerifySchemaTokenParams
>;
export type CompleteRegisterDto = z.infer<
  typeof AuthValidation.CompleteRegisterSchema
>;
export type LoginDto = z.infer<typeof AuthValidation.LoginSchema>;
export type ResendDto = z.infer<typeof AuthValidation.ResendSchema>;
export type ResetRequestDto = z.infer<typeof AuthValidation.ResetRequestSchema>;
export type ResetConfirmDto = z.infer<typeof AuthValidation.ResetConfirmSchema>;
export type UpdateMeDto = z.infer<typeof AuthValidation.UpdateMeSchema>;
export type EmailChangeRequestDto = z.infer<
  typeof AuthValidation.EmailChangeRequestSchema
>;
export type EmailChangeConfirmDto = z.infer<
  typeof AuthValidation.EmailChangeConfirmSchema
>;
