import { z } from "zod";
import "zod-openapi";

export class OutletValidation {
  static CreateOutletSchema = z
    .object({
      name: z.string().meta({
        description: "Outlet name",
        example: "I-Wash Noda Surabaya",
      }),
      address: z.string().meta({
        description: "Outlet address",
        example: "Jl. Basin No.789",
      }),
      city: z.string().meta({
        description: "City name",
        example: "Surabaya",
      }),
      province: z.string().meta({
        description: "Province name",
        example: "Jawa Timur",
      }),
      lat: z.number().meta({
        description: "Latitude coordinate",
        example: -7.2575,
      }),
      lng: z.number().meta({
        description: "Longitude coordinate",
        example: 112.7521,
      }),
      coverageRadius: z.number().optional().meta({
        description: "Coverage radius in km",
        example: 5,
      }),
    })
    .meta({
      id: "CreateOutlet",
      description: "Payload for creating a new outlet",
      example: {
        name: "I-Wash Noda Surabaya",
        address: "Jl. Basin No.789",
        city: "Surabaya",
        province: "Jawa Timur",
        lat: -7.2575,
        lng: 112.7521,
        coverageRadius: 5,
      },
    });

  static UpdateOutletSchema = z
    .object({
      name: z.string().optional().meta({
        description: "Outlet name",
        example: "I-Wash Noda Surabaya - Updated",
      }),
      address: z.string().optional().meta({
        description: "Outlet address",
        example: "Jl. New Address No.100",
      }),
      city: z.string().optional().meta({
        description: "City name",
        example: "Surabaya",
      }),
      province: z.string().optional().meta({
        description: "Province name",
        example: "Jawa Timur",
      }),
      lat: z.number().optional().meta({
        description: "Latitude coordinate",
        example: -7.2575,
      }),
      lng: z.number().optional().meta({
        description: "Longitude coordinate",
        example: 112.7521,
      }),
      coverageRadius: z.number().optional().meta({
        description: "Coverage radius in km",
        example: 10,
      }),
    })
    .meta({
      id: "UpdateOutlet",
      description: "Payload for updating an outlet",
      example: {
        name: "I-Wash Noda Surabaya - Updated",
        address: "Jl. New Address No.100",
        coverageRadius: 10,
      },
    });

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
}

export type CreateOutletDto = z.infer<
  typeof OutletValidation.CreateOutletSchema
>;
export type UpdateOutletDto = z.infer<
  typeof OutletValidation.UpdateOutletSchema
>;
export type CreateItemDto = z.infer<typeof OutletValidation.CreateItemSchema>;
