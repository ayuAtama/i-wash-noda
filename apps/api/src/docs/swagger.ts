import { createDocument } from "zod-openapi";
import { z } from "zod";

import { UserValidation } from "../validations/user.validation";
import { AuthValidation } from "../validations/auth.validation";
import { AddressValidation } from "../validations/address.validation";
import { AdminValidation } from "../validations/admin.validation";
import { OutletValidation } from "../validations/outlet.validation";
import { WorkerShiftValidation } from "../validations/workerShift.validation";
import { PickupRequestValidation } from "../validations/pickupRequest.validation";
import { PickupOrderValidation } from "../validations/pickupOrder.validation";
import { AdminOrderValidation } from "../validations/adminOrder.validation";

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

const OutletCoverageQuery = z.object({
  lat: z.number().meta({
    description: "Latitude coordinate",
    example: -6.2088,
  }),
  lng: z.number().meta({
    description: "Longitude coordinate",
    example: 106.8456,
  }),
});

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "I-Wash-Noda API",
    version: "1.0.0",
    description:
      "API documentation for I-Wash-Noda laundry service application",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Development server",
    },
  ],
  tags: [
    { name: "User Management", description: "User CRUD operations" },
    { name: "Authentication", description: "User authentication endpoints" },
    {
      name: "User Profile",
      description: "User profile management including avatar",
    },
    { name: "Addresses", description: "User address management" },
    { name: "Outlets", description: "Outlet management" },
    { name: "Items", description: "Service item management" },
    { name: "Admin", description: "Admin user management" },
    { name: "Worker Shifts", description: "Worker schedule management" },
    {
      name: "Pickup Requests",
      description: "Customer pickup request management",
    },
    { name: "Pickup Orders", description: "Driver pickup order management" },
    { name: "Orders", description: "Order management" },
  ],
  paths: {
    "/users": {
      get: {
        summary: "List all users",
        tags: ["User Management"],
        responses: {
          "200": {
            description: "OK - Returns array of users",
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
        summary: "Create user",
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
            description: "Created - User created successfully",
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
          "400": { description: "Bad Request - Invalid input" },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Get user by ID",
        tags: ["User Management"],
        requestParams: { path: UserIdParam },
        responses: {
          "200": {
            description: "OK - Returns user object",
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
          "404": { description: "Not Found - User not found" },
        },
      },
      put: {
        summary: "Update user",
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
            description: "OK - User updated successfully",
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
          "400": { description: "Bad Request - Invalid input" },
          "404": { description: "Not Found - User not found" },
        },
      },
      delete: {
        summary: "Delete user",
        tags: ["User Management"],
        requestParams: { path: UserIdParam },
        responses: {
          "200": { description: "OK - User deleted successfully" },
          "404": { description: "Not Found - User not found" },
        },
      },
    },
    "/register": {
      post: {
        summary: "Register new user (Step 1)",
        tags: ["Authentication"],
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
            description: "Created - Registration initiated",
            content: {
              "application/json": {
                example: {
                  message: "User registered. Verification email sent.",
                  "email verified": false,
                },
              },
            },
          },
          "400": { description: "Bad Request - Email required" },
        },
      },
    },
    "/verify": {
      post: {
        summary: "Verify email with OTP (Step 2)",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.VerifySchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Created - Email verified",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Email verified successfully",
                },
              },
            },
          },
          "400": { description: "Bad Request - Token required" },
          "401": { description: "Unauthorized - Invalid token" },
        },
      },
    },
    "/complete-register": {
      post: {
        summary: "Complete registration (Step 3)",
        tags: ["Authentication"],
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
            description: "Created - Registration completed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Registration completed successfully",
                  "email verified": true,
                  role: "customer",
                  "created at": "Jan 1, 2025 10:00",
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing required fields" },
        },
      },
    },
    "/resend": {
      post: {
        summary: "Resend verification OTP",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AuthValidation.ResendSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Created - Verification email resent",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Verification email resent successfully",
                },
              },
            },
          },
          "400": { description: "Bad Request - Email required" },
        },
      },
    },
    "/login": {
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
            description: "OK - Login successful",
            content: {
              "application/json": {
                example: { success: true, message: "Login successful" },
              },
            },
          },
          "400": { description: "Bad Request - Email and password required" },
          "401": { description: "Unauthorized - Invalid credentials" },
        },
      },
    },
    "/logout": {
      get: {
        summary: "Logout current user",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Logout successful",
            content: {
              "application/json": {
                example: { success: true, message: "Logout successful" },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/refresh": {
      get: {
        summary: "Refresh access token",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Token refreshed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Access token refreshed! and Refresh token updated!",
                },
              },
            },
          },
          "401": { description: "Unauthorized - Invalid refresh token" },
        },
      },
    },
    "/reset-request": {
      post: {
        summary: "Request password reset",
        tags: ["Authentication"],
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
            description: "OK - Reset email sent",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Password reset email sent",
                },
              },
            },
          },
          "400": { description: "Bad Request - Email required" },
        },
      },
    },
    "/reset-confirm": {
      post: {
        summary: "Confirm password reset",
        tags: ["Authentication"],
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
            description: "OK - Password reset confirmed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Password reset successfully",
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Invalid token" },
        },
      },
    },
    "/me": {
      get: {
        summary: "Get current user",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns current user",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User fetched successfully",
                  user: {
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
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - User not found" },
        },
      },
      put: {
        summary: "Update current user",
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
            description: "OK - User updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "User updated",
                  user: {
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
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/me/avatar": {
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
    "/change-email-request": {
      post: {
        summary: "Request email change",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
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
            description: "OK - Verification email sent",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Verification email sent to new email",
                },
              },
            },
          },
          "400": { description: "Bad Request - Email required" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/change-email": {
      put: {
        summary: "Confirm email change",
        tags: ["Authentication"],
        security: [{ CookieAuth: [] }],
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
            description: "OK - Email changed",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Email updated successfully",
                  user: {
                    id: "uuid",
                    email: "newemail@example.com",
                    name: "John Doe",
                  },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Invalid token" },
        },
      },
    },
    "/addresses": {
      get: {
        summary: "Get all user addresses",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns addresses",
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
                      city: "Jakarta",
                      province: "DKI Jakarta",
                      postalCode: "12345",
                      lat: -6.2088,
                      lng: 106.8456,
                      isDefault: true,
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
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
            description: "Created - Address created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address created successfully",
                  data: {
                    id: "uuid",
                    label: "Home",
                    address: "123 Main St",
                    isDefault: true,
                  },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/addresses/{id}": {
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
            description: "OK - Address updated",
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
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Address not found" },
        },
      },
      delete: {
        summary: "Delete address",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: AddressIdParam },
        responses: {
          "200": {
            description: "OK - Address deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address deleted successfully",
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Address not found" },
        },
      },
    },
    "/addresses/{id}/set-default": {
      post: {
        summary: "Set default address",
        tags: ["Addresses"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: AddressIdParam },
        responses: {
          "200": {
            description: "OK - Default address updated",
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
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Address not found" },
        },
      },
    },
    "/outlets-coverage": {
      get: {
        summary: "Get outlets by location",
        tags: ["Outlets"],
        requestParams: { query: OutletCoverageQuery },
        responses: {
          "200": {
            description: "OK - Returns outlets in coverage area",
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
                      city: "Jakarta",
                      province: "DKI Jakarta",
                      lat: -6.2088,
                      lng: 106.8456,
                      coverageRadius: 5,
                    },
                  ],
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing lat or lng" },
          "404": { description: "Not Found - No outlets in area" },
        },
      },
    },
    "/outlets": {
      get: {
        summary: "List all outlets",
        tags: ["Outlets"],
        responses: {
          "200": {
            description: "OK - Returns all outlets",
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
      post: {
        summary: "Create new outlet",
        tags: ["Outlets"],
        security: [{ CookieAuth: [] }],
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
            description: "Created - Outlet created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Outlet created successfully",
                  data: { id: "uuid", name: "I-Wash Noda Surabaya" },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": {
            description: "Forbidden - Only super_admin can create outlet",
          },
        },
      },
    },
    "/outlets/{id}": {
      put: {
        summary: "Update outlet",
        tags: ["Outlets"],
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
            description: "OK - Outlet updated",
            content: {
              "application/json": {
                example: {
                  status: true,
                  message: "Outlet updated successfully",
                  data: { id: "uuid", name: "I-Wash Noda Surabaya - Updated" },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": {
            description: "Forbidden - Only super_admin can update outlet",
          },
        },
      },
      delete: {
        summary: "Delete outlet",
        tags: ["Outlets"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: OutletIdParam },
        responses: {
          "200": {
            description: "OK - Outlet deleted",
            content: {
              "application/json": {
                example: {
                  status: true,
                  message: "Outlet deleted successfully",
                  data: { id: "uuid" },
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": {
            description: "Forbidden - Only super_admin can delete outlet",
          },
        },
      },
    },
    "/items": {
      get: {
        summary: "List all items",
        tags: ["Items"],
        responses: {
          "200": {
            description: "OK - Returns all items",
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
        },
      },
      post: {
        summary: "Create new item",
        tags: ["Items"],
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: OutletValidation.CreateItemSchema,
            },
          },
        },
        responses: {
          "201": {
            description: "Created - Item created",
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
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": {
            description: "Forbidden - Only super_admin can create item",
          },
        },
      },
    },
    "/admin/register": {
      post: {
        summary: "Register internal user",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
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
            description: "Created - Internal user registered",
            content: {
              "application/json": {
                example: {
                  message: "driver User registered. Verification email sent.",
                  role: "driver",
                  "email verified": false,
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing email or role" },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": {
            description: "Forbidden - Only super_admin can create admin",
          },
        },
      },
    },
    "/admin/users": {
      get: {
        summary: "List all users (admin view)",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns all users",
            content: {
              "application/json": {
                example: {
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
          "401": { description: "Unauthorized - Not authenticated" },
          "403": { description: "Forbidden - Insufficient permissions" },
        },
      },
      put: {
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
            description: "OK - Role changed",
            content: {
              "application/json": {
                example: {
                  message: "Role changed successfully",
                  data: { id: "uuid", role: "outlet_admin" },
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing userId or role" },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": { description: "Forbidden - Insufficient permissions" },
        },
      },
      delete: {
        summary: "Remove user",
        tags: ["Admin"],
        security: [{ CookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AdminValidation.RemoveUserSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "OK - User removed",
            content: {
              "application/json": {
                example: {
                  message: "User removed successfully",
                  data: { id: "uuid" },
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing userId" },
          "401": { description: "Unauthorized - Not authenticated" },
          "403": { description: "Forbidden - Insufficient permissions" },
        },
      },
    },
    "/admin/schedule": {
      post: {
        summary: "Create/update worker schedule",
        tags: ["Worker Shifts"],
        security: [{ CookieAuth: [] }],
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
            description: "OK - Schedule saved",
            content: {
              "application/json": {
                example: { message: "Worker weekly schedule saved" },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/admin/schedule/{id}": {
      get: {
        summary: "Get schedule by worker ID",
        tags: ["Worker Shifts"],
        requestParams: { path: WorkerIdParam },
        responses: {
          "200": {
            description: "OK - Returns worker schedule",
            content: {
              "application/json": {
                example: [
                  {
                    id: "uuid",
                    workerId: "uuid",
                    outletId: "uuid",
                    station: "WASHING",
                    day: "MONDAY",
                    startTime: "08:00",
                    endTime: "16:00",
                  },
                ],
              },
            },
          },
          "404": { description: "Not Found - Schedule not found" },
        },
      },
    },
    "/check/pickup-request": {
      get: {
        summary: "Check address coverage",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns coverage info",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Address checked successfully",
                  data: {
                    hasAddress: true,
                    withinCoverage: true,
                    availableOutlets: [
                      { id: "uuid", name: "I-Wash Noda Jakarta Pusat" },
                    ],
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/pickup-request": {
      get: {
        summary: "Get all pickup requests (driver)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns pickup requests",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  message: "Pickup requests fetched successfully",
                  pickupRequests: [
                    {
                      id: "uuid",
                      userId: "uuid",
                      addressId: "uuid",
                      outletId: "uuid",
                      status: "PENDING",
                      createdAt: "2025-01-01T10:00:00Z",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
      post: {
        summary: "Create pickup request",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
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
            description: "Created - Pickup request created",
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
          "400": { description: "Bad Request - Missing addressId or outletId" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/pickup-request/jobs": {
      get: {
        summary: "Get accepted jobs",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns accepted jobs",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  message: "Pickup requests fetched successfully",
                  result: [
                    {
                      id: "uuid",
                      userId: "uuid",
                      addressId: "uuid",
                      status: "ACCEPTED",
                      driverId: "uuid",
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/pickup-request/{id}/accept": {
      post: {
        summary: "Accept pickup request",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: PickupRequestIdParam },
        responses: {
          "200": {
            description: "OK - Request accepted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup request accepted successfully",
                  data: { id: "uuid", status: "ACCEPTED", driverId: "uuid" },
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing request ID" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/pickup-request/{id}/status": {
      put: {
        summary: "Update job status",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
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
            description: "OK - Status updated",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  message: "Job status updated successfully",
                  result: { id: "uuid", status: "PICKED_UP" },
                },
              },
            },
          },
          "400": { description: "Bad Request - Missing status" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/order/{id}": {
      put: {
        summary: "Create order from pickup request",
        tags: ["Orders"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: PickupRequestIdParam },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: AdminOrderValidation.AdminOrderSchema,
            },
          },
        },
        responses: {
          "200": {
            description: "OK - Order created",
            content: {
              "application/json": {
                example: {
                  message: "Order created",
                  order: {
                    id: "uuid",
                    pickupRequestId: "uuid",
                    outletId: "uuid",
                    totalKilos: 5,
                    totalPrice: 85000,
                    status: "PROCESSING",
                    createdAt: "2025-01-01T10:00:00Z",
                  },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      CookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
        description: "JWT access token stored in HTTP-only cookie",
      },
    },
  },
});
