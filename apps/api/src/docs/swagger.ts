// src/docs/swagger.ts
import { createDocument } from "zod-openapi";
import { z } from "zod";
import { UserValidation } from "../validations/user.validation";

const UserIdParam = z.object({
  id: z.string().meta({
    description: "User ID",
    example: "1",
  }),
});

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "User API",
    version: "1.0.0",
  },

  paths: {
    "/users": {
      get: {
        summary: "List all users",
        responses: {
          "200": {
            description: "OK",
          },
        },
      },

      post: {
        summary: "Create user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: UserValidation.CreateUserSchema,
              examples: {
                default: {
                  summary: "Example user",
                  value: {
                    name: "John Doe",
                    email: "john@example.com",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
        },
      },
    },

    "/users/{id}": {
      get: {
        summary: "Get user by ID",
        requestParams: {
          path: UserIdParam, // zod-openapi will merge this automatically
        },
        responses: {
          "200": { description: "OK" },
          "404": { description: "Not found" },
        },
      },

      put: {
        summary: "Update user",
        requestParams: { path: UserIdParam },
        requestBody: {
          content: {
            "application/json": {
              schema: UserValidation.UpdateUserSchema,
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
        },
      },

      delete: {
        summary: "Delete user",
        requestParams: { path: UserIdParam },
        responses: {
          "200": { description: "Deleted" },
        },
      },
    },
  },
});
