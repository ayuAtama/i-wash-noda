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
import {
  WalkInCustomerValidation,
  ManualOrderValidation,
  UpdateOrderItemValidation,
} from "../validations/adminOrder.validation";

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

const OutletCoverageQuery = z.object({
  lat: z.coerce.number().meta({
    description: "Latitude coordinate",
    example: -6.2088,
  }),
  lng: z.coerce.number().meta({
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
    { name: "Authentication", description: "User authentication endpoints" },
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
    { name: "Cloudinary", description: "Cloudinary upload signature" },
  ],
  paths: {
    "/": {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "OK - API is healthy",
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
    "/api/users": {
      get: {
        summary: "List all users (deprecated)",
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
    "/api/users/{id}": {
      get: {
        summary: "Get user by ID (deprecated)",
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
        summary: "Delete user (deprecated)",
        tags: ["User Management"],
        requestParams: { path: UserIdParam },
        responses: {
          "200": { description: "OK - User deleted successfully" },
          "404": { description: "Not Found - User not found" },
        },
      },
    },
    "/api/register": {
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
    "/api/verify": {
      post: {
        summary: "Verify email with OTP (Step 2)",
        tags: ["Authentication"],
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
    "/api/complete-register": {
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
    "/api/resend-otp": {
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
    "/api/logout": {
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
    "/api/refresh": {
      get: {
        summary: "Refresh access token",
        tags: ["Authentication"],
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
    "/api/reset-password-request": {
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
    "/api/reset-password-confirm": {
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
    "/api/me": {
      get: {
        summary: "Get current user profile",
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
    "/api/change-email-request": {
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
    "/api/change-email-confirm": {
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
    "/api/addresses": {
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
    "/api/addresses/{id}/set-default": {
      put: {
        summary: "Set address as default",
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
    "/api/outlets/coverage": {
      get: {
        summary: "Get outlets by location coverage",
        tags: ["Outlets"],
        requestParams: { query: OutletValidation.OutletCoverageQuerySchema },
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
    "/api/outlets": {
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
        },
      },
    },
    "/api/outlets/{id}": {
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
        },
      },
    },
    "/api/items": {
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
              schema: ItemValidation.CreateItemSchema,
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
        },
      },
    },
    "/api/items/search": {
      get: {
        summary: "Search items by name",
        tags: ["Items"],
        security: [{ CookieAuth: [] }],
        requestParams: { query: ItemValidation.QueryItemSchema },
        responses: {
          "200": {
            description: "OK - Returns matching items",
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
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/api/items/{id}": {
      get: {
        summary: "Get item by ID",
        tags: ["Items"],
        requestParams: { path: ItemIdParam },
        responses: {
          "200": {
            description: "OK - Returns item",
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
          "404": { description: "Not Found - Item not found" },
        },
      },
      put: {
        summary: "Update item",
        tags: ["Items"],
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
            description: "OK - Item updated",
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
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Item not found" },
        },
      },
      delete: {
        summary: "Delete item",
        tags: ["Items"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: ItemIdParam },
        responses: {
          "200": {
            description: "OK - Item deleted",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Item deleted successfully",
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Item not found" },
        },
      },
    },
    "/api/admin/register": {
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
        },
      },
    },
    "/api/admin/schedule": {
      post: {
        summary: "Create/update worker schedule",
        tags: ["Worker Shifts"],
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
        },
      },
    },
    "/api/admin/schedule/{id}": {
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
    "/api/pickup-requests/coverage-check": {
      get: {
        summary: "Check address coverage for pickup",
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
    "/api/pickup-requests": {
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
      get: {
        summary: "Get all pending pickup requests (driver view)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns pending pickup requests",
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
    },
    "/api/pickup-requests/{id}": {
      delete: {
        summary: "Cancel pickup request",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        requestParams: { path: PickupRequestIdParam },
        responses: {
          "200": {
            description: "OK - Pickup request cancelled",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Pickup request cancelled successfully",
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Pickup request not found" },
        },
      },
    },
    "/api/pickup-requests/status": {
      get: {
        summary: "Check user pickup request/order status",
        tags: ["Pickup Requests"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns order status",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Order status fetched successfully",
                  data: { status: "PROCESSING" },
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/api/pickup-requests/{id}/accept": {
      post: {
        summary: "Accept pickup request (driver)",
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
    "/api/pickup-requests/accepted": {
      get: {
        summary: "Get accepted jobs (driver)",
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
    "/api/pickup-requests/{id}/status": {
      patch: {
        summary: "Update job status (driver)",
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
    "/api/pickup-requests/already-picked-up": {
      get: {
        summary: "Get already picked up jobs (driver)",
        tags: ["Pickup Orders"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns picked up jobs",
            content: {
              "application/json": {
                example: {
                  status: "success",
                  message: "Already picked up jobs fetched successfully",
                  result: [
                    {
                      id: "uuid",
                      userId: "uuid",
                      addressId: "uuid",
                      status: "PICKED_UP",
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
    "/api/admin/orders/walk-in-customer": {
      post: {
        summary: "Create walk-in customer",
        tags: ["Orders"],
        security: [{ CookieAuth: [] }],
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
            description: "Created - Walk-in customer created",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Walk-in customer created successfully",
                  data: {
                    id: "uuid",
                    name: "John Doe",
                    phone: "+6281234567890",
                  },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
      get: {
        summary: "Search walk-in customers",
        tags: ["Orders"],
        security: [{ CookieAuth: [] }],
        requestParams: {
          query: WalkInCustomerValidation.keywordWalkInCustomerSchema,
        },
        responses: {
          "200": {
            description: "OK - Returns matching customers",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Customers fetched successfully",
                  data: [
                    { id: "uuid", name: "John Doe", phone: "+6281234567890" },
                  ],
                },
              },
            },
          },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/api/admin/orders/walk-in-customer/orders": {
      post: {
        summary: "Create manual walk-in order",
        tags: ["Orders"],
        security: [{ CookieAuth: [] }],
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
            description: "Created - Order created",
            content: {
              "application/json": {
                example: {
                  message: "Order created",
                  order: {
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
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
        },
      },
    },
    "/api/admin/orders": {
      get: {
        summary: "Get all orders for outlet",
        tags: ["Orders"],
        security: [{ CookieAuth: [] }],
        responses: {
          "200": {
            description: "OK - Returns orders",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Orders fetched successfully",
                  data: [
                    {
                      id: "uuid",
                      outletId: "uuid",
                      status: "PROCESSING",
                      totalKilo: 5,
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
    },
    "/api/admin/orders/{orderId}": {
      patch: {
        summary: "Update order items",
        tags: ["Orders"],
        security: [{ CookieAuth: [] }],
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
            description: "OK - Order updated",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Order updated successfully",
                  data: { id: "uuid", items: [] },
                },
              },
            },
          },
          "400": { description: "Bad Request - Invalid input" },
          "401": { description: "Unauthorized - Not authenticated" },
          "404": { description: "Not Found - Order not found" },
        },
      },
    },
    "/api/get-upload-signature": {
      get: {
        summary: "Get Cloudinary upload signature",
        tags: ["Cloudinary"],
        security: [{ CookieAuth: [] }],
        requestParams: { query: CloudinaryValidation.RequestSignatureSchema },
        responses: {
          "200": {
            description: "OK - Returns upload signature",
            content: {
              "application/json": {
                example: {
                  success: true,
                  signature: "abc123signature",
                  timestamp: 1234567890,
                },
              },
            },
          },
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
