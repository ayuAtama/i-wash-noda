import { createDocument } from "zod-openapi";
import { z } from "zod";

import { UserValidation } from "../validations/user.validation";
import { AuthValidation } from "../validations/auth.validation";
import { AddressValidation } from "../validations/address.validation";
import { AdminValidation } from "../validations/admin.validation";
import { ItemValidation } from "../validations/item.validation";
import { OutletValidation } from "../validations/outlet.validation";
import { WorkerShiftValidation } from "../validations/workerShift.validation";
import { PickupRequestValidation } from "../validations/pickupRequest.validation";
import { PickupOrderValidation } from "../validations/pickupOrder.validation";
import { AdminOrderValidation } from "../validations/adminOrder.validation";
import { CloudinaryValidation } from "../validations/cloudinary.validation";
import { CustomerOrderValidation } from "../validations/customerOrder.validation";
import { DeliveryOrderValidation } from "../validations/deliveryOder.validation";
import { WorkerStationValidation } from "../validations/workerStation.validation";
import { AdminMismatchValidation } from "../validations/adminMismatch.validation";
import {
  WalkInCustomerValidation,
  ManualOrderValidation,
  UpdateOrderItemValidation,
  ComplaintOrderValidation,
  PaymentOrderValidation,
  UpdateWalkInCustomerValidation,
} from "../validations/adminOrder.validation";

// ── Shared Path Params ──────────────────────────────────────────

const UserIdParam = z.object({
  id: z.string().uuid().meta({
    description: "User ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const AddressIdParam = z.object({
  id: z.string().uuid().meta({
    description: "Address ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const OutletIdParam = z.object({
  id: z.string().uuid().meta({
    description: "Outlet ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const WorkerIdParam = z.object({
  id: z.string().uuid().meta({
    description: "Worker ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const PickupRequestIdParam = z.object({
  id: z.string().uuid().meta({
    description: "Pickup Request ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const ItemIdParam = z.object({
  id: z.string().uuid().meta({
    description: "Item ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const OrderIdParam = z.object({
  orderId: z.string().uuid().meta({
    description: "Order ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const UserIdPathParam = z.object({
  userId: z.string().uuid().meta({
    description: "User ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const DeliveryIdParam = z.object({
  deliveryId: z.string().uuid().meta({
    description: "Delivery Request ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const StationNamePathParam = z.object({
  stationName: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Station name (washing, ironing, or packing)",
    example: "washing",
  }),
});

const ComplaintIdPathParam = z.object({
  complaintId: z.string().uuid().meta({
    description: "Complaint ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

const ComplaintStatusPathParam = z.object({
  status: z.enum(["resolved", "rejected"]).meta({
    description: "Complaint resolution action",
    example: "resolved",
  }),
});

const PaymentProofIdActionParam = z.object({
  id: z.string().uuid().meta({
    description: "Payment Proof ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  action: z.enum(["approved", "rejected"]).meta({
    description: "Payment proof action",
    example: "approved",
  }),
});

const CloudinaryFolderParam = z.object({
  folder: z.enum(["avatars", "payment-proofs", "complaints"]).meta({
    description: "Upload folder name",
    example: "avatars",
  }),
  params: z.string().optional().meta({
    description: "Additional parameter (UUID or identifier)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  unique: z.boolean().optional().meta({
    description: "Generate unique filename",
    example: true,
  }),
});

// ── OpenAPI Document ────────────────────────────────────────────

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "I-Wash-Noda API",
    version: "1.0.0",
    description:
      "Comprehensive API documentation for I-Wash-Noda laundry service application. " +
      "This API supports customer orders, pickup/delivery via drivers, worker station operations, " +
      "admin management, and walk-in customer flows.",
    contact: {
      name: "I-Wash-Noda API Support",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Health", description: "Health check endpoint" },
    {
      name: "User Management",
      description: "User CRUD operations (deprecated - testing only)",
    },
    {
      name: "Authentication",
      description:
        "User authentication endpoints including multi-step registration, login, " +
        "password reset, and profile management",
    },
    {
      name: "Better Auth",
      description: "Social login via Better Auth (Google, GitHub, Twitter)",
    },
    { name: "Addresses", description: "Customer address management" },
    {
      name: "Outlets",
      description: "Public outlet listing and location coverage queries",
    },
    {
      name: "Admin Outlets",
      description: "Admin outlet CRUD (super_admin only)",
    },
    {
      name: "Admin Items",
      description: "Admin service item management (super_admin, outlet_admin)",
    },
    {
      name: "Admin",
      description:
        "Admin internal user management (register, role changes, removal)",
    },
    {
      name: "Worker Shifts",
      description: "Worker schedule management with filtering and dashboard",
    },
    {
      name: "User Profile",
      description: "User profile management including avatar",
    },

    {
      name: "Pickup Requests",
      description: "Customer pickup request management",
    },
    {
      name: "Pickup Orders",
      description: "Driver pickup order management (accept, status updates)",
    },
    {
      name: "Customer Orders",
      description:
        "Customer-facing order operations: check status, upload payment proof, " +
        "mark complete, submit complaints",
    },
    {
      name: "Delivery Orders",
      description:
        "Driver delivery order management: available jobs, accept, active, completed",
    },
    {
      name: "Worker Stations",
      description:
        "Worker station operations: check available/active jobs, accept, reinput quantities, " +
        "mark complete (washing, ironing, packing stations)",
    },
    {
      name: "Admin Orders",
      description:
        "Admin order management for outlet: list orders, update items, " +
        "manage payment proofs and customer complaints",
    },
    {
      name: "Walk-in Customers",
      description:
        "Walk-in customer management: create, search, update, delete, and create manual orders",
    },
    {
      name: "Admin Mismatch",
      description:
        "Admin mismatch management: list mismatches by station, view details, " +
        "approve/reject item discrepancies",
    },
    {
      name: "Cloudinary",
      description: "Cloudinary upload signature generation for file uploads",
    },
  ],
  paths: {
    // ═══════════════════════════════════════════════════════════════
    // Health
    // ═══════════════════════════════════════════════════════════════
    "/": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "API is running",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "API is healthy",
                  data: { timestamp: "2025-01-01T10:00:00Z" },
                },
              },
            },
          },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Better Auth (Social Login)
    // ═══════════════════════════════════════════════════════════════
    "/api/auth/{splat}": {
      get: {
        summary: "Better Auth handler (social login flows)",
        tags: ["Better Auth"],
        description:
          "Catch-all route handled by Better Auth library. Supports Google, GitHub, " +
          "Twitter OAuth sign-in, sign-up, and session management.",
        parameters: [
          {
            name: "splat",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Better Auth sub-path (e.g. /api/auth/sign-in/google)",
          },
        ],
        responses: {
          "200": {
            description: "Auth flow response (redirect or JSON)",
          },
        },
      },
      post: {
        summary: "Better Auth handler (POST flows)",
        tags: ["Better Auth"],
        responses: {
          "200": {
            description: "Auth flow response",
          },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // User Management (deprecated)
    // ═══════════════════════════════════════════════════════════════
    "/api/users": {
      get: {
        summary: "List all users (deprecated)",
        tags: ["User Management"],
        responses: {
          "200": {
            description: "Returns array of users",
            content: {
              "application/json": {
                example: [
                  { id: "uuid", name: "John Doe", email: "john@example.com" },
                  { id: "uuid", name: "Jane Smith", email: "jane@example.com" },
                ],
              },
            },
          },
        },
      },
      post: {
        summary: "Create user (deprecated)",
        tags: ["User Management"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: UserValidation.CreateUserSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                example: {
                  id: "uuid",
                  name: "John Doe",
                  email: "john@example.com",
                },
              },
            },
          },
          "400": { description: "Invalid input" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        summary: "Get user by ID (deprecated)",
        tags: ["User Management"],
        requestParams: { path: UserIdParam },
        responses: {
          "200": {
            description: "Returns user object",
            content: {
              "application/json": {
                example: {
                  id: "uuid",
                  name: "John Doe",
                  email: "john@example.com",
                },
              },
            },
          },
          "404": { description: "User not found" },
        },
      },
      put: {
        summary: "Update user (deprecated)",
        tags: ["User Management"],
        requestParams: { path: UserIdParam },
        requestBody: {
          content: {
            "application/json": {
              schema: UserValidation.UpdateUserSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "User updated successfully",
            content: {
              "application/json": {
                example: {
                  id: "uuid",
                  name: "John Updated",
                  email: "updated@example.com",
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "404": { description: "User not found" },
        },
      },
      delete: {
        summary: "Delete user (deprecated)",
        tags: ["User Management"],
        requestParams: { path: UserIdParam },
        responses: {
          "200": { description: "User deleted successfully" },
          "404": { description: "User not found" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Authentication
    // ═══════════════════════════════════════════════════════════════
    "/api/register": {
      post: {
        summary: "Register new user (Step 1 of 3)",
        tags: ["Authentication"],
        description:
          "Initiates registration by sending a verification OTP to the given email. " +
          "Rate limited to 10 requests per window.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.RegisterSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Registration initiated, verification email sent",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User registered. Verification email sent.",
                  data: { emailVerified: false },
                },
              },
            },
          },
          "400": { description: "Email required or already registered" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/verify": {
      post: {
        summary: "Verify email with OTP (Step 2 of 3)",
        tags: ["Authentication"],
        description:
          "Verifies the 6-digit OTP sent to the user's email. " +
          "Requires a valid temp_jwt cookie from the register step.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.VerifySchemaTokenBody,
            },
          },
        },
        requestParams: {
          query: AuthValidation.VerifySchemaTokenParams,
        },
        responses: {
          "201": {
            description: "Email verified successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Email verified successfully",
                  data: { emailVerified: true },
                },
              },
            },
          },
          "400": { description: "Token required" },
          "401": { description: "Invalid or expired token" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/complete-register": {
      post: {
        summary: "Complete registration (Step 3 of 3)",
        tags: ["Authentication"],
        description:
          "Finalizes registration with name, password, and optional phone/role. " +
          "Requires verified email via temp_jwt cookie.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.CompleteRegisterSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Registration completed successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Registration completed successfully",
                  data: {
                    emailVerified: true,
                    role: "customer",
                    createdAt: "Jan 1, 2025 10:00",
                  },
                },
              },
            },
          },
          "400": { description: "Missing required fields" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/resend-otp": {
      post: {
        summary: "Resend verification OTP",
        tags: ["Authentication"],
        description:
          "Resends the verification OTP email. Rate limited to 3 requests.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.ResendSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Verification email resent",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Verification email resent successfully",
                  data: null,
                },
              },
            },
          },
          "400": { description: "Email required" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/login": {
      post: {
        summary: "Login with email and password",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.LoginSchema,
            },
          },
        },
        responses: {
          "200": {
            description:
              "Login successful, sets access_token and refresh_token cookies",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Login successful",
                  data: {
                    name: "John Doe",
                    email: "john@example.com",
                    role: "customer",
                    worker_station: null,
                  },
                },
              },
            },
          },
          "400": { description: "Email and password required" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/logout": {
      get: {
        summary: "Logout current user",
        tags: ["Authentication"],
        description: "Clears access_token and refresh_token cookies",
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                example: { success: true, message: "Logout successful" },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/refresh": {
      get: {
        summary: "Refresh access token",
        tags: ["Authentication"],
        description:
          "Refreshes the access token using the refresh_token cookie. " +
          "The access token must be expired for this to work.",
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "Token refreshed successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Access token refreshed! and Refresh token updated!",
                },
              },
            },
          },
          "401": { description: "Invalid or missing refresh token" },
        },
      },
    },
    "/api/reset-password-request": {
      post: {
        summary: "Request password reset",
        tags: ["Authentication"],
        description: "Sends a password reset OTP to the user's email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.ResetRequestSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Reset email sent",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Password reset email sent",
                  data: null,
                },
              },
            },
          },
          "400": { description: "Email required" },
        },
      },
    },
    "/api/reset-password-confirm": {
      post: {
        summary: "Confirm password reset",
        tags: ["Authentication"],
        description:
          "Confirms password reset with email, new password, and OTP token. " +
          "Requires temp_jwt cookie from reset-password-request step.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.ResetConfirmSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Password reset successfully",
                  data: {},
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Invalid or expired token" },
        },
      },
    },
    "/api/me": {
      get: {
        summary: "Get current user profile",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "Returns current authenticated user",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User fetched successfully",
                  data: {
                    id: "uuid",
                    email: "user@example.com",
                    name: "John Doe",
                    phone: "+1234567890",
                    role: "customer",
                    emailVerified: true,
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "User not found" },
        },
      },
      put: {
        summary: "Update current user profile",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.UpdateMeSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Profile updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User updated",
                  data: {
                    id: "uuid",
                    email: "user@example.com",
                    name: "John Updated",
                    phone: "+1987654321",
                    role: "customer",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/me/avatar": {
      post: {
        summary: "Upload user avatar",
        tags: ["User Profile"],
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  avatar: {
                    type: "string",
                    format: "binary",
                    description:
                      "Image file (JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF, HEIC). Max 2MB. Resized to max 500x500.",
                  },
                },
                required: ["avatar"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OK - Avatar uploaded successfully",
            content: {
              "application/json": {
                schema: AuthValidation.AvatarUploadResponseSchema,
                example: {
                  success: true,
                  message: "Avatar uploaded successfully",
                  data: {
                    image:
                      "https://res.cloudinary.com/xxx/image/upload/v123/avatars/abc.jpg",
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad Request - Validation failed",
            content: {
              "application/json": {
                example: {
                  success: false,
                  message: "File too large. Maximum size is 2MB",
                  code: "AVATAR_FILE_TOO_LARGE",
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
          "429": { description: "Too Many Requests - Rate limited" },
        },
      },
      delete: {
        summary: "Delete user avatar",
        tags: ["User Profile"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Avatar deleted successfully",
            content: {
              "application/json": {
                schema: AuthValidation.AvatarDeleteResponseSchema,
                example: {
                  success: true,
                  message: "Avatar deleted successfully",
                  data: { image: null },
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - User or avatar not found" },
          "429": { description: "Too Many Requests - Rate limited" },
        },
      },
    },
    "/api/change-email-request": {
      post: {
        summary: "Request email change",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        description:
          "Sends a verification OTP to the new email address. " +
          "Requires authenticated user.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.EmailChangeRequestSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Verification email sent to new address",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Verification email sent to new email",
                  data: null,
                },
              },
            },
          },
          "400": { description: "Email required" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/change-email-confirm": {
      put: {
        summary: "Confirm email change",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        description:
          "Confirms the email change with the OTP token. " +
          "Requires temp_jwt cookie from change-email-request step.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.EmailChangeConfirmSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Email updated successfully",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Email updated successfully",
                  data: {
                    id: "uuid",
                    email: "newemail@example.com",
                    name: "John Doe",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Invalid or expired token" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Addresses
    // ═══════════════════════════════════════════════════════════════
    "/api/addresses": {
      get: {
        summary: "Get all user addresses",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "Returns all addresses for the authenticated user",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Addresses fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      label: "Home",
                      address: "123 Main St",
                      lat: -6.2088,
                      lng: 106.8456,
                      isDefault: true,
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
      post: {
        summary: "Create new address",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AddressValidation.CreateAddressSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Address created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address created successfully",
                  data: {
                    id: "uuid",
                    label: "Home",
                    address: "123 Main St",
                    lat: -6.2088,
                    lng: 106.8456,
                    isDefault: true,
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/addresses/{id}": {
      put: {
        summary: "Update address",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: AddressIdParam },
        requestBody: {
          content: {
            "application/json": {
              schema: AddressValidation.UpdateAddressSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Address updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address updated successfully",
                  data: { id: "uuid", label: "Home Updated" },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "404": { description: "Address not found" },
        },
      },
      delete: {
        summary: "Delete address",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: AddressIdParam },
        responses: {
          "200": {
            description: "Address deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address deleted successfully",
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Address not found" },
        },
      },
    },
    "/api/addresses/{id}/set-default": {
      put: {
        summary: "Set address as default",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: AddressIdParam },
        responses: {
          "200": {
            description: "Default address updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Default address updated successfully",
                  data: { id: "uuid", label: "Home", isDefault: true },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Address not found" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Outlets (Public)
    // ═══════════════════════════════════════════════════════════════
    "/api/outlets/coverage": {
      get: {
        summary: "Get outlets by location coverage",
        tags: ["Outlets"],
        description:
          "Returns outlets whose coverage area includes the given lat/lng coordinates. " +
          "Uses haversine distance calculation.",
        requestParams: { query: OutletValidation.OutletCoverageQuerySchema },
        responses: {
          "200": {
            description: "Returns outlets in coverage area",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Outlet coverage fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      name: "I-Wash Noda Jakarta Pusat",
                      address: "Jl. Sudirman No.123",
                      lat: -6.2088,
                      lng: 106.8456,
                      maxDistanceKm: 5,
                      pricePerKm: 2000,
                      pricePerKg: 8000,
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Missing lat or lng" },
          "404": { description: "No outlets in coverage area" },
        },
      },
    },
    "/api/outlets": {
      get: {
        summary: "List all outlets",
        tags: ["Outlets"],
        responses: {
          "200": {
            description: "Returns all active outlets",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Outlets fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      name: "I-Wash Noda Jakarta Pusat",
                      address: "Jl. Sudirman No.123",
                    },
                    {
                      id: "uuid",
                      name: "I-Wash Noda Bandung",
                      address: "Jl. Braga No.45",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Admin Outlets
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/outlets": {
      post: {
        summary: "Create new outlet",
        tags: ["Admin Outlets"],
        security: [{ CookieAuth: [] }],
        description: "Creates a new laundry outlet. Requires super_admin role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: OutletValidation.CreateOutletSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Outlet created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Outlet created successfully",
                  data: {
                    id: "uuid",
                    name: "I-Wash Noda Surabaya",
                    address: "Jl. Pemuda No.10",
                    lat: -7.2575,
                    lng: 112.7521,
                    maxDistanceKm: 10,
                    pricePerKm: 2500,
                    pricePerKg: 9000,
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "403": {
            description: "Insufficient permissions (requires super_admin)",
          },
        },
      },
    },
    "/api/admin/outlets/{id}": {
      put: {
        summary: "Update outlet",
        tags: ["Admin Outlets"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: OutletIdParam },
        requestBody: {
          content: {
            "application/json": {
              schema: OutletValidation.UpdateOutletSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Outlet updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Outlet updated successfully",
                  data: { id: "uuid", name: "I-Wash Noda Surabaya - Updated" },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
      delete: {
        summary: "Delete outlet",
        tags: ["Admin Outlets"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: OutletIdParam },
        responses: {
          "200": {
            description: "Outlet deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Outlet deleted successfully",
                  data: { id: "uuid" },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Admin Items
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/items": {
      get: {
        summary: "List all items",
        tags: ["Admin Items"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "Returns all service items",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Items fetched successfully",
                  data: [
                    { id: "uuid", name: "Cuci Kering", pricePerKg: 8000 },
                    { id: "uuid", name: "Cuci Setrika", pricePerKg: 12000 },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
      post: {
        summary: "Create new item",
        tags: ["Admin Items"],
        security: [{ CookieAuth: [] }],
        description: "Creates a new service item. Requires super_admin role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ItemValidation.CreateItemSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Item created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Item created successfully",
                  data: { id: "uuid", name: "Cuci Karpet", pricePerKg: 15000 },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },
    "/api/admin/items/search": {
      get: {
        summary: "Search items by name",
        tags: ["Admin Items"],
        security: [{ CookieAuth: [] }],
        requestParams: { query: ItemValidation.QueryItemSchema },
        responses: {
          "200": {
            description: "Returns matching items",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Items fetched successfully",
                  data: [
                    { id: "uuid", name: "Baju Pramuka", pricePerKg: 8000 },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/admin/items/{id}": {
      get: {
        summary: "Get item by ID",
        tags: ["Admin Items"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: ItemIdParam },
        responses: {
          "200": {
            description: "Returns item details",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Item fetched successfully",
                  data: { id: "uuid", name: "Cuci Kering", pricePerKg: 8000 },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Item not found" },
        },
      },
      put: {
        summary: "Update item",
        tags: ["Admin Items"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: ItemIdParam },
        requestBody: {
          content: {
            "application/json": {
              schema: ItemValidation.UpdateItemSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Item updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Item updated successfully",
                  data: { id: "uuid", name: "Seragam Sekolah" },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
          "404": { description: "Item not found" },
        },
      },
      delete: {
        summary: "Delete item",
        tags: ["Admin Items"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: ItemIdParam },
        responses: {
          "200": {
            description: "Item deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Item deleted successfully",
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
          "404": { description: "Item not found" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Admin (User Management)
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/register": {
      post: {
        summary: "Register internal user (worker/driver)",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
        description:
          "Registers an internal user (worker, driver, or admin). " +
          "A verification email is sent. Requires super_admin or outlet_admin role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AdminValidation.RegisterInternalUserSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Internal user registered",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "driver User registered. Verification email sent.",
                  data: { role: "driver", emailVerified: false },
                },
              },
            },
          },
          "400": { description: "Missing email or role" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },
    "/api/admin/users": {
      get: {
        summary: "List all users (admin view)",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "Returns all users",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      email: "admin@example.com",
                      role: "super_admin",
                      outletId: null,
                    },
                    {
                      id: "uuid",
                      email: "driver@example.com",
                      role: "driver",
                      outletId: "uuid",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
      patch: {
        summary: "Change user role",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AdminValidation.ChangeRoleSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Role changed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Role changed successfully",
                  data: { id: "uuid", role: "outlet_admin" },
                },
              },
            },
          },
          "400": { description: "Missing userId or role" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },
    "/api/admin/users/{userId}": {
      delete: {
        summary: "Remove user",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: UserIdPathParam },
        responses: {
          "200": {
            description: "User removed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User removed successfully",
                  data: { id: "uuid" },
                },
              },
            },
          },
          "400": { description: "Missing userId" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Worker Shifts
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/schedule": {
      get: {
        summary: "List all schedules (with filters)",
        tags: ["Worker Shifts"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all worker schedules for the outlet. Supports filtering by " +
          "role, station, and ordering. Requires super_admin or outlet_admin role.",
        requestParams: {
          query: WorkerShiftValidation.FilterQueryScheduleSchema,
        },
        responses: {
          "200": {
            description: "Returns filtered schedules",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Schedules fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      workerId: "uuid",
                      worker: { name: "Budi", email: "budi@example.com" },
                      outletId: "uuid",
                      station: "washing",
                      day: "MONDAY",
                      startTime: "08:00",
                      endTime: "16:00",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },
    "/api/admin/schedule/no-shift-workers": {
      get: {
        summary: "Get workers without schedules",
        tags: ["Worker Shifts"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns workers/drivers who do not have any shift assigned. " +
          "Supports keyword search and role filter.",
        requestParams: {
          query: WorkerShiftValidation.FetchUnScheduledWorkerSchema,
        },
        responses: {
          "200": {
            description: "Returns unscheduled workers",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Unscheduled workers fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      name: "Ahmad",
                      email: "ahmad@example.com",
                      role: "worker",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },
    "/api/admin/schedule/summary-dashboard": {
      get: {
        summary: "Schedule summary dashboard",
        tags: ["Worker Shifts"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns a summary of all worker shifts for the dashboard view. " +
          "Shows station coverage across days.",
        responses: {
          "200": {
            description: "Returns schedule summary",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Schedule summary fetched successfully",
                  data: {
                    totalWorkers: 10,
                    stations: {
                      washing: { MONDAY: 3, TUESDAY: 4, WEDNESDAY: 2 },
                      ironing: { MONDAY: 2, TUESDAY: 3, WEDNESDAY: 2 },
                      packing: { MONDAY: 2, TUESDAY: 2, WEDNESDAY: 1 },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
    },
    "/api/admin/schedule/{id}": {
      post: {
        summary: "Create or update worker schedule",
        tags: ["Worker Shifts"],
        security: [{ CookieAuth: [] }],
        description:
          "Creates or updates a weekly schedule for a worker. " +
          "Validates for overlapping shifts across the outlet.",
        requestParams: { path: WorkerIdParam },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: WorkerShiftValidation.CreateWorkerShiftSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Schedule saved",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Worker weekly schedule saved",
                  data: [
                    {
                      id: "uuid",
                      workerId: "uuid",
                      day: "MONDAY",
                      startTime: "08:00",
                      endTime: "16:00",
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Invalid input or overlapping schedules" },
          "401": { description: "Not authenticated" },
          "403": { description: "Insufficient permissions" },
        },
      },
      get: {
        summary: "Get schedule by worker ID",
        tags: ["Worker Shifts"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: WorkerIdParam },
        responses: {
          "200": {
            description: "Returns worker schedule",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Schedule fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      workerId: "uuid",
                      outletId: "uuid",
                      station: "washing",
                      day: "MONDAY",
                      startTime: "08:00",
                      endTime: "16:00",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Schedule not found" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Pickup Requests (Customer)
    // ═══════════════════════════════════════════════════════════════
    "/api/pickup-requests/coverage-check": {
      get: {
        summary: "Check address coverage for pickup",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        description:
          "Checks if the customer's default address is within an outlet's " +
          "pickup coverage radius.",
        responses: {
          "200": {
            description: "Returns coverage info",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address checked successfully",
                  data: {
                    hasAddress: true,
                    withinCoverage: true,
                    nearestOutlet: {
                      id: "uuid",
                      name: "I-Wash Noda Jakarta Pusat",
                      distanceKm: 2.5,
                    },
                    address: {
                      id: "uuid",
                      label: "Home",
                      lat: -6.2088,
                      lng: 106.8456,
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "No default address found" },
        },
      },
    },
    "/api/pickup-requests": {
      post: {
        summary: "Create pickup request",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        description: "Creates a new pickup request for a customer order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: PickupRequestValidation.CreatePickupRequestSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Pickup request created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup request created successfully",
                  data: {
                    id: "uuid",
                    userId: "uuid",
                    addressId: "uuid",
                    outletId: "uuid",
                    status: "PENDING",
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "400": { description: "Missing addressId or outletId" },
          "401": { description: "Not authenticated" },
        },
      },
      get: {
        summary: "Get all pending pickup requests (driver view)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all pending pickup requests available for the driver to accept. " +
          "Requires driver role.",
        responses: {
          "200": {
            description: "Returns pending pickup requests",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup requests fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      userId: "uuid",
                      addressId: "uuid",
                      outletId: "uuid",
                      status: "PENDING",
                      createdAt: "2025-01-01T10:00:00Z",
                      user: { name: "John", phone: "+6281234567890" },
                      address: { label: "Home", address: "123 Main St" },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires driver role" },
        },
      },
    },
    "/api/pickup-requests/{id}": {
      delete: {
        summary: "Cancel pickup request",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        description: "Cancels a pending pickup request",
        requestParams: { path: PickupRequestIdParam },
        responses: {
          "200": {
            description: "Pickup request cancelled",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup request cancelled successfully",
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Pickup request not found" },
        },
      },
    },
    "/api/pickup-requests/status": {
      get: {
        summary: "Check user pickup request/order status",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns the status of the customer's latest pickup request",
        responses: {
          "200": {
            description: "Returns order status",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Order status fetched successfully",
                  data: {
                    id: "uuid",
                    status: "PROCESSING",
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Pickup Orders (Driver)
    // ═══════════════════════════════════════════════════════════════
    "/api/pickup-requests/{id}/accept": {
      post: {
        summary: "Accept pickup request (driver)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        description: "Driver accepts a pending pickup request",
        requestParams: { path: PickupRequestIdParam },
        responses: {
          "200": {
            description: "Request accepted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup request accepted successfully",
                  data: {
                    id: "uuid",
                    status: "ACCEPTED",
                    driverId: "uuid",
                  },
                },
              },
            },
          },
          "400": { description: "Missing request ID" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/pickup-requests/accepted": {
      get: {
        summary: "Get accepted jobs (driver)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all pickup requests accepted by the current driver",
        responses: {
          "200": {
            description: "Returns accepted jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup requests fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      userId: "uuid",
                      addressId: "uuid",
                      status: "ACCEPTED",
                      driverId: "uuid",
                      user: { name: "John", phone: "+6281234567890" },
                      address: { label: "Home", address: "123 Main St" },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/pickup-requests/{id}/next": {
      patch: {
        summary: "Update pickup status (driver)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Advances the pickup status to the next step. " +
          "Status flow: ACCEPTED -> IN_TRANSIT -> ON_DELIVERY -> DONE",
        requestParams: { path: PickupRequestIdParam },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: PickupOrderValidation.UpdateStatusSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Job status updated successfully",
                  data: { id: "uuid", status: "IN_TRANSIT" },
                },
              },
            },
          },
          "400": { description: "Missing or invalid status" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/pickup-requests/already-picked-up": {
      get: {
        summary: "Get already picked up jobs (driver)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        description: "Returns all completed pickup jobs for the current driver",
        responses: {
          "200": {
            description: "Returns completed pickup jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Already picked up jobs fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      userId: "uuid",
                      addressId: "uuid",
                      status: "DONE",
                      driverId: "uuid",
                      completedAt: "2025-01-01T15:00:00Z",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Customer Orders
    // ═══════════════════════════════════════════════════════════════
    "/api/orders/active": {
      get: {
        summary: "Check active order status",
        tags: ["Customer Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns the customer's currently active (in-progress) order. " +
          "Requires customer role.",
        responses: {
          "200": {
            description: "Returns active order with status and progress",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Active order fetched successfully",
                  data: {
                    id: "uuid",
                    status: "washing",
                    totalKilo: 5,
                    totalPrice: 85000,
                    createdAt: "2025-01-01T10:00:00Z",
                    items: [
                      { name: "Cuci Kering", quantity: 3, price: 24000 },
                      { name: "Cuci Setrika", quantity: 2, price: 24000 },
                    ],
                    outlet: { name: "I-Wash Noda Jakarta Pusat" },
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "No active order" },
        },
      },
    },
    "/api/orders/complete": {
      get: {
        summary: "Check completed order status",
        tags: ["Customer Orders"],
        security: [{ CookieAuth: [] }],
        description: "Returns the customer's most recently completed order",
        responses: {
          "200": {
            description: "Returns completed order",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Completed order fetched successfully",
                  data: {
                    id: "uuid",
                    status: "finished",
                    totalKilo: 5,
                    totalPrice: 85000,
                    completedAt: "2025-01-03T14:00:00Z",
                    items: [{ name: "Cuci Kering", quantity: 3, price: 24000 }],
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "No completed order" },
        },
      },
    },
    "/api/orders/{orderId}/payment": {
      post: {
        summary: "Upload payment proof",
        tags: ["Customer Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Uploads a payment proof image URL for a manual transfer order. " +
          "Requires customer role.",
        requestParams: { path: OrderIdParam },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: CustomerOrderValidation.PaymentProofSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Payment proof uploaded",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Payment proof uploaded successfully",
                  data: {
                    id: "uuid",
                    orderId: "uuid",
                    urlProof: "https://example.com/proof.jpg",
                    status: "pending",
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid orderId or urlProof" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/orders/{orderId}/complete": {
      post: {
        summary: "Mark order as done by customer",
        tags: ["Customer Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Customer confirms the order has been received and marks it as complete. " +
          "Requires customer role.",
        requestParams: { path: OrderIdParam },
        responses: {
          "200": {
            description: "Order marked as complete",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Order marked as complete",
                  data: { id: "uuid", status: "finished" },
                },
              },
            },
          },
          "400": { description: "Invalid orderId" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/orders/{orderId}/complaint": {
      post: {
        summary: "Submit complaint",
        tags: ["Customer Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Submits a complaint for an order with a message and optional image. " +
          "Requires customer role.",
        requestParams: { path: OrderIdParam },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: CustomerOrderValidation.ComplainSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Complaint submitted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Complaint submitted successfully",
                  data: {
                    id: "uuid",
                    orderId: "uuid",
                    complaintMessage: "Why the order is late?",
                    complaintImage: "https://example.com/complain.jpg",
                    status: "pending",
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid orderId or complaint data" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Delivery Orders (Driver)
    // ═══════════════════════════════════════════════════════════════
    "/api/driver/delivery-requests/available": {
      get: {
        summary: "Check available delivery jobs",
        tags: ["Delivery Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all pending delivery requests for the driver's outlet. " +
          "Requires driver role and resolved context.",
        responses: {
          "200": {
            description: "Returns available delivery jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Available delivery requests fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      orderId: "uuid",
                      outletId: "uuid",
                      driverId: null,
                      status: "pending",
                      createdAt: "2025-01-01T10:00:00Z",
                      order: {
                        id: "uuid",
                        totalKilo: 5,
                        totalPrice: 85000,
                        address: "123 Main St",
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires driver role" },
        },
      },
    },
    "/api/driver/delivery-requests/{deliveryId}/accept": {
      post: {
        summary: "Accept delivery job",
        tags: ["Delivery Orders"],
        security: [{ CookieAuth: [] }],
        description: "Driver accepts a pending delivery request",
        requestParams: { path: DeliveryIdParam },
        responses: {
          "200": {
            description: "Delivery accepted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Delivery request accepted successfully",
                  data: {
                    id: "uuid",
                    orderId: "uuid",
                    status: "accepted",
                    driverId: "uuid",
                  },
                },
              },
            },
          },
          "400": { description: "Missing delivery ID" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/driver/delivery-requests/{deliveryId}/next": {
      patch: {
        summary: "Update delivery status",
        tags: ["Delivery Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Advances the delivery status to the next step. " +
          "Status flow: ACCEPTED -> IN_TRANSIT -> DELIVERED",
        requestParams: { path: DeliveryIdParam },
        responses: {
          "200": {
            description: "Status updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Delivery status updated successfully",
                  data: {
                    id: "uuid",
                    status: "IN_TRANSIT",
                  },
                },
              },
            },
          },
          "400": { description: "Missing delivery ID" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/driver/delivery-requests/active": {
      get: {
        summary: "Check active delivery jobs",
        tags: ["Delivery Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all active (in-progress) delivery jobs for the driver",
        responses: {
          "200": {
            description: "Returns active delivery jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Active delivery requests fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      orderId: "uuid",
                      status: "IN_TRANSIT",
                      driverId: "uuid",
                      order: {
                        id: "uuid",
                        totalKilo: 5,
                        totalPrice: 85000,
                        address: "123 Main St",
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/driver/delivery-requests/complete": {
      get: {
        summary: "Get completed delivery jobs",
        tags: ["Delivery Orders"],
        security: [{ CookieAuth: [] }],
        description: "Returns all completed delivery jobs for the driver",
        responses: {
          "200": {
            description: "Returns completed delivery jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Completed delivery requests fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      orderId: "uuid",
                      status: "DELIVERED",
                      driverId: "uuid",
                      completedAt: "2025-01-01T16:00:00Z",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Worker Stations
    // ═══════════════════════════════════════════════════════════════
    "/api/workers/available": {
      get: {
        summary: "Check available jobs for worker station",
        tags: ["Worker Stations"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns orders waiting to be processed at the worker's assigned station " +
          "(washing, ironing, or packing). Requires worker role and active shift.",
        responses: {
          "200": {
            description: "Returns available jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Available jobs fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      status: "arrived_at_outlet",
                      totalKilo: 5,
                      station: "washing",
                      items: [
                        { name: "Cuci Kering", quantity: 3 },
                        { name: "Cuci Setrika", quantity: 2 },
                      ],
                      createdAt: "2025-01-01T10:00:00Z",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "No available jobs" },
        },
      },
    },
    "/api/workers/active": {
      get: {
        summary: "Check active jobs for worker station",
        tags: ["Worker Stations"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns orders currently being processed by the worker at their station",
        responses: {
          "200": {
            description: "Returns active jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Active jobs fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      status: "washing",
                      totalKilo: 5,
                      workerId: "uuid",
                      items: [{ name: "Cuci Kering", quantity: 3 }],
                      startedAt: "2025-01-01T10:30:00Z",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/workers/{orderId}/accept": {
      post: {
        summary: "Assign job to self (worker)",
        tags: ["Worker Stations"],
        security: [{ CookieAuth: [] }],
        description:
          "Worker accepts/claims an order for processing at their station",
        requestParams: { path: OrderIdParam },
        responses: {
          "200": {
            description: "Job assigned",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Job assigned successfully",
                  data: { id: "uuid", status: "washing", workerId: "uuid" },
                },
              },
            },
          },
          "400": { description: "Invalid orderId" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/workers/reinput/{orderId}": {
      post: {
        summary: "Re-input item quantities",
        tags: ["Worker Stations"],
        security: [{ CookieAuth: [] }],
        description:
          "Worker re-enters item quantities after checking. " +
          "If quantities differ from the original, a mismatch is recorded.",
        requestParams: {
          path: WorkerStationValidation.reInputItemParamsSchema,
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: WorkerStationValidation.reInputItemBodySchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Items re-inputted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Item quantities re-inputted successfully",
                  data: {
                    orderId: "uuid",
                    items: [
                      { itemId: "uuid", itemQuantity: 3 },
                      { itemId: "uuid", itemQuantity: 2 },
                    ],
                    hasMismatch: false,
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/workers/complete/{orderId}": {
      post: {
        summary: "Mark job as done (worker)",
        tags: ["Worker Stations"],
        security: [{ CookieAuth: [] }],
        description:
          "Worker marks their station's processing as complete. " +
          "The order advances to the next station in the workflow.",
        requestParams: {
          path: WorkerStationValidation.reInputItemParamsSchema,
        },
        responses: {
          "200": {
            description: "Job completed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Job marked as complete",
                  data: {
                    id: "uuid",
                    status: "washing_completed",
                    completedAt: "2025-01-01T12:00:00Z",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid orderId" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/workers/complete": {
      get: {
        summary: "Get completed jobs for worker station",
        tags: ["Worker Stations"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all jobs completed by the current worker at their station",
        responses: {
          "200": {
            description: "Returns completed jobs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Completed jobs fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      status: "washing_completed",
                      totalKilo: 5,
                      workerId: "uuid",
                      completedAt: "2025-01-01T12:00:00Z",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Admin Orders
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/orders": {
      get: {
        summary: "Get all orders for outlet",
        tags: ["Admin Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all orders for the admin's outlet. " +
          "Requires outlet_admin role.",
        responses: {
          "200": {
            description: "Returns orders",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Orders fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      outletId: "uuid",
                      status: "washing",
                      totalKilo: 5,
                      totalPrice: 85000,
                      source: "customer_app",
                      createdAt: "2025-01-01T10:00:00Z",
                      user: { name: "John", email: "john@example.com" },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires outlet_admin role" },
        },
      },
    },
    "/api/admin/orders/{orderId}": {
      patch: {
        summary: "Update order items",
        tags: ["Admin Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Updates the items and total weight of an order that has arrived at the outlet. " +
          "Recalculates pricing based on new weights.",
        requestParams: { path: OrderIdParam },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: UpdateOrderItemValidation.UpdateOrderItemSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Order updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Order updated successfully",
                  data: {
                    id: "uuid",
                    totalKilo: 5,
                    totalPrice: 85000,
                    items: [
                      { name: "Cuci Kering", quantity: 3 },
                      { name: "Cuci Setrika", quantity: 2 },
                    ],
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "404": { description: "Order not found" },
        },
      },
    },
    "/api/admin/orders/payment-proof": {
      get: {
        summary: "Check customer payment proofs",
        tags: ["Admin Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all pending payment proofs for the outlet. " +
          "Requires outlet_admin role.",
        responses: {
          "200": {
            description: "Returns payment proofs",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Payment proofs fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      orderId: "uuid",
                      urlProof: "https://example.com/proof.jpg",
                      status: "pending",
                      createdAt: "2025-01-01T10:00:00Z",
                      order: {
                        id: "uuid",
                        totalPrice: 85000,
                        user: { name: "John" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires outlet_admin role" },
        },
      },
    },
    "/api/admin/orders/payment-proof/{id}/{action}": {
      post: {
        summary: "Approve or reject payment proof",
        tags: ["Admin Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Approves or rejects a customer's payment proof. " +
          "If approved, the order status advances to the next step.",
        requestParams: { path: PaymentProofIdActionParam },
        responses: {
          "200": {
            description: "Payment proof action taken",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Payment proof approved successfully",
                  data: {
                    id: "uuid",
                    orderId: "uuid",
                    status: "approved",
                  },
                },
              },
            },
          },
          "400": { description: "Missing id or action" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/admin/orders/complaints": {
      get: {
        summary: "Get all pending complaints",
        tags: ["Admin Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all customer complaints pending resolution for the outlet. " +
          "Requires outlet_admin role.",
        responses: {
          "200": {
            description: "Returns pending complaints",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Complaints fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      orderId: "uuid",
                      complaintMessage: "Why the order is late?",
                      complaintImage: "https://example.com/complain.jpg",
                      status: "pending",
                      createdAt: "2025-01-01T10:00:00Z",
                      order: {
                        id: "uuid",
                        user: { name: "John" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires outlet_admin role" },
        },
      },
    },
    "/api/admin/orders/complaints/{complaintId}/{status}": {
      post: {
        summary: "Resolve or reject customer complaint",
        tags: ["Admin Orders"],
        security: [{ CookieAuth: [] }],
        description:
          "Admin responds to a customer complaint with a resolution or rejection. " +
          "Requires outlet_admin role.",
        requestParams: {
          path: z
            .object({
              complaintId: z.string().uuid().meta({
                description: "Complaint ID (UUID)",
                example: "123e4567-e89b-12d3-a456-426614174000",
              }),
              status: z.enum(["resolved", "rejected"]).meta({
                description: "Action to take on the complaint",
                example: "resolved",
              }),
            })
            .meta({
              id: "ComplaintActionParams",
              description: "Path params for complaint resolution",
            }),
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ComplaintOrderValidation.ComplaintBodySchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Complaint resolved",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Complaint resolved successfully",
                  data: {
                    id: "uuid",
                    orderId: "uuid",
                    status: "resolved",
                    adminResponse: "We apologize for the inconvenience.",
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid complaintId, status, or adminResponse",
          },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Walk-in Customers
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/walk-in-customer": {
      post: {
        summary: "Create walk-in customer",
        tags: ["Walk-in Customers"],
        security: [{ CookieAuth: [] }],
        description:
          "Creates a walk-in customer profile for walk-in orders. " +
          "Requires outlet_admin role.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: WalkInCustomerValidation.CreateWalkInCustomerSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Walk-in customer created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Walk-in customer created successfully",
                  data: {
                    id: "uuid",
                    name: "John Doe",
                    phone: "+6281234567890",
                    outletId: "uuid",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
        },
      },
      get: {
        summary: "Search walk-in customers",
        tags: ["Walk-in Customers"],
        security: [{ CookieAuth: [] }],
        description: "Searches walk-in customers by name or phone keyword",
        requestParams: {
          query: WalkInCustomerValidation.keywordWalkInCustomerSchema,
        },
        responses: {
          "200": {
            description: "Returns matching customers",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Customers fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      name: "John Doe",
                      phone: "+6281234567890",
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Missing keyword" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/admin/walk-in-customer/{id}": {
      patch: {
        summary: "Update walk-in customer",
        tags: ["Walk-in Customers"],
        security: [{ CookieAuth: [] }],
        description: "Updates a walk-in customer's name or phone number",
        requestParams: {
          path: UpdateWalkInCustomerValidation.IDParamSchema,
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: UpdateWalkInCustomerValidation.UpdateWalkInCustomerSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Walk-in customer updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Walk-in customer updated successfully",
                  data: {
                    id: "uuid",
                    name: "John Updated",
                    phone: "+628999999999",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
          "404": { description: "Walk-in customer not found" },
        },
      },
      delete: {
        summary: "Delete walk-in customer",
        tags: ["Walk-in Customers"],
        security: [{ CookieAuth: [] }],
        description: "Deletes a walk-in customer profile",
        requestParams: {
          path: UpdateWalkInCustomerValidation.IDParamSchema,
        },
        responses: {
          "200": {
            description: "Walk-in customer deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Walk-in customer deleted successfully",
                  data: { id: "uuid" },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Walk-in customer not found" },
        },
      },
    },
    "/api/admin/walk-in-customer/orders/{id}": {
      post: {
        summary: "Create manual walk-in order",
        tags: ["Walk-in Customers"],
        security: [{ CookieAuth: [] }],
        description:
          "Creates a manual order for a walk-in customer. " +
          "All fees are set to 0 since the customer is at the outlet.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Walk-in customer ID (UUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: ManualOrderValidation.CreateManualOrderSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Order created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Order created",
                  data: {
                    id: "uuid",
                    outletId: "uuid",
                    totalKilo: 5,
                    totalPrice: 85000,
                    status: "arrived_at_outlet",
                    source: "walk_in",
                    paid: true,
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Admin Mismatch
    // ═══════════════════════════════════════════════════════════════
    "/api/admin/mismatch": {
      get: {
        summary: "Get all mismatches (with station filter)",
        tags: ["Admin Mismatch"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns all item quantity mismatches for the outlet. " +
          "Can be filtered by station name. Supports pagination.",
        requestParams: { query: AdminMismatchValidation.QueryValidation },
        responses: {
          "200": {
            description: "Returns mismatches",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Mismatches fetched successfully",
                  data: [
                    {
                      orderId: "uuid",
                      stationName: "washing",
                      items: [
                        {
                          itemId: "uuid",
                          itemName: "Cuci Kering",
                          expectedQty: 3,
                          actualQty: 2,
                          difference: -1,
                        },
                      ],
                      reportedAt: "2025-01-01T10:00:00Z",
                      workerId: "uuid",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "403": { description: "Requires outlet_admin role" },
        },
      },
    },
    "/api/admin/mismatch/{orderId}/{stationName}": {
      get: {
        summary: "Get detail mismatch data",
        tags: ["Admin Mismatch"],
        security: [{ CookieAuth: [] }],
        description:
          "Returns detailed mismatch data for a specific order and station",
        requestParams: {
          path: AdminMismatchValidation.DetailMismatchDataParams,
        },
        responses: {
          "200": {
            description: "Returns detail mismatch data",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Detail mismatch data fetched successfully",
                  data: {
                    orderId: "uuid",
                    stationName: "washing",
                    items: [
                      {
                        itemId: "uuid",
                        itemName: "Cuci Kering",
                        originalQty: 3,
                        reInputQty: 2,
                        difference: -1,
                        status: "pending",
                      },
                    ],
                    worker: { id: "uuid", name: "Budi" },
                    reportedAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "404": { description: "Mismatch not found" },
        },
      },
      put: {
        summary: "Manage mismatch (approve/reject)",
        tags: ["Admin Mismatch"],
        security: [{ CookieAuth: [] }],
        description:
          "Admin reviews mismatched items: approves or rejects each item, " +
          "and updates final quantities.",
        requestParams: {
          path: AdminMismatchValidation.OrderIdStationNameParams,
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AdminMismatchValidation.ManageMismatchSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "Mismatch managed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Mismatch managed successfully",
                  data: {
                    orderId: "uuid",
                    stationName: "washing",
                    decisions: [
                      {
                        itemId: "uuid",
                        status: "approved",
                        adminNote: "Item is approved",
                      },
                    ],
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input" },
          "401": { description: "Not authenticated" },
        },
      },
    },

    // ═══════════════════════════════════════════════════════════════
    // Cloudinary
    // ═══════════════════════════════════════════════════════════════
    "/api/signature/{folder}": {
      get: {
        summary: "Get Cloudinary upload signature",
        tags: ["Cloudinary"],
        security: [{ CookieAuth: [] }],
        description:
          "Generates a signed upload URL for Cloudinary. " +
          "Rate limited to 5 requests per window. " +
          "Folders: avatars, payment-proofs, complaints.",
        requestParams: {
          path: CloudinaryFolderParam,
        },
        responses: {
          "200": {
            description: "Returns upload signature",
            content: {
              "application/json": {
                example: {
                  success: true,
                  data: {
                    signature: "abc123signature",
                    timestamp: 1234567890,
                    folder: "avatars",
                    apiKey: "123456789012345",
                    cloudName: "your-cloud-name",
                  },
                },
              },
            },
          },
          "401": { description: "Not authenticated" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // Components
  // ═══════════════════════════════════════════════════════════════
  components: {
    securitySchemes: {
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
        description:
          "JWT access token stored in an HTTP-only cookie. " +
          "Obtained via /api/login or /api/register flow. " +
          "Expires after 15 minutes by default.",
      },
    },
  },
});
