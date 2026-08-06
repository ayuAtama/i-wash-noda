import { z } from "zod";
import "zod-openapi";

export class OutletValidation {
  static OutletCoverageQuerySchema = z
    .object({
      lat: z.coerce.number().meta({
        description: "Latitude coordinate",
        example: -6.2088,
      }),
      lng: z.coerce.number().meta({
        description: "Longitude coordinate",
        example: 106.8456,
      }),
    })
    .meta({
      id: "OutletCoverageQuery",
      description: "Payload for getting outlet coverage",
      example: {
        lat: -6.2088,
        lng: 106.8456,
      },
    });

  static OutletIdParamSchema = z
    .object({
      id: z.uuid({ error: "Outlet ID must be a valid UUID" }).meta({
        description: "Outlet ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "OutletIdParam",
      description: "Payload for getting an outlet by ID",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

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
      lat: z.number().meta({
        description: "Latitude coordinate",
        example: -7.2575,
      }),
      lng: z.number().meta({
        description: "Longitude coordinate",
        example: 112.7521,
      }),
      max_distance_km: z.number().meta({
        description: "Coverage radius in km",
        example: 5,
      }),
      price_per_km: z.number().meta({
        description: "Delivery pickup and delivery price per kilometer",
        example: 5000,
      }),
      price_per_kg: z.number().meta({
        description: "Laundry price per kilogram",
        example: 5000,
      }),
    })
    .meta({
      id: "CreateOutlet",
      description: "Payload for creating a new outlet",
      example: {
        name: "Di desa ga pakai dollar",
        address: "Jln. yang telah ditentukan",
        lat: -2.9845123,
        lng: 104.7423812,
        max_distance_km: 2,
        price_per_km: 3000,
        price_per_kg: 3982,
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
      lat: z.number().optional().meta({
        description: "Latitude coordinate",
        example: -7.2575,
      }),
      lng: z.number().optional().meta({
        description: "Longitude coordinate",
        example: 112.7521,
      }),
      max_distance_km: z.number().optional().meta({
        description: "Coverage radius in km",
        example: 10,
      }),
      price_per_km: z.number().optional().meta({
        description: "Delivery pickup and delivery price per kilometer",
        example: 5000,
      }),
      price_per_kg: z.number().optional().meta({
        description: "Laundry price per kilogram",
        example: 5000,
      }),
    })
    .meta({
      id: "UpdateOutlet",
      description: "Payload for updating an outlet",
      example: {
        name: "I-Wash Noda Surabaya - Updated",
        address: "Jl. New Address No.100",
        max_distance_km: 10,
      },
    });

  static userId = z.uuid().meta({
    description: "User ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  });
}

export type CreateOutletDto = z.infer<
  typeof OutletValidation.CreateOutletSchema
>;

export type UpdateOutletDto = z.infer<
  typeof OutletValidation.UpdateOutletSchema
>;

export type OutletIdParamDto = z.infer<
  typeof OutletValidation.OutletIdParamSchema
>;

export type OutletCoverageQueryDto = z.infer<
  typeof OutletValidation.OutletCoverageQuerySchema
>;

export type UserIdDto = z.infer<typeof OutletValidation.userId>;
