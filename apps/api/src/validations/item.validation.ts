import { z } from "zod";
import "zod-openapi";

export class ItemValidation {
  static CreateItemSchema = z
    .object({
      name: z.string().meta({
        description: "Item/service name",
        example: "Cuci Karpet",
      }),
    })
    .meta({
      id: "CreateItem",
      description: "Payload for creating a new item",
      example: {
        name: "Cuci Karpet",
      },
    });

  static UpdateItemSchema = z
    .object({
      name: z.string("Why are you updating this? without name?").meta({
        description: "Item/service name",
        example: "Seragam Sekolah",
      }),
    })
    .meta({
      id: "UpdateItme",
      description: "Payload for updating an item",
      example: {
        name: "Seragam Sekolah",
      },
    });

  static ParamsItemSchema = z
    .object({
      id: z.uuid().meta({
        description: "Item ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "ParamsItem",
      description: "Payload for getting an item by ID",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });
}

export type CreateItemDto = z.infer<typeof ItemValidation.CreateItemSchema>;
export type UpdateItemDto = z.infer<typeof ItemValidation.UpdateItemSchema>;
