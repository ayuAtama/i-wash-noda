import { z } from "zod";
import "zod-openapi";

export class AddressValidation {
  static CreateAddressSchema = z
    .object({
      label: z.string().meta({
        description: "Address label (e.g., Home, Office)",
        example: "Home",
      }),
      address: z.string().meta({
        description: "Street address",
        example: "123 Main St",
      }),
      lat: z.number().meta({
        description: "Latitude coordinate",
        example: -6.2088,
      }),
      lng: z.number().meta({
        description: "Longitude coordinate",
        example: 106.8456,
      }),
      isDefault: z.boolean().default(false).meta({
        description: "Indicates if the address is the default address",
        example: false,
      }),
    })
    .meta({
      id: "CreateAddress",
      description: "Payload for creating a new address",
      example: {
        label: "Home",
        address: "123 Main St",
        lat: -6.2088,
        lng: 106.8456,
        isDefault: false,
      },
    });

  static UpdateAddressSchema = z
    .object({
      label: z.string().optional().meta({
        description: "Address label",
        example: "Home Updated",
      }),
      address: z.string().optional().meta({
        description: "Street address",
        example: "789 New Street",
      }),
      lat: z.number().optional().meta({
        description: "Latitude coordinate",
        example: -6.9147,
      }),
      lng: z.number().optional().meta({
        description: "Longitude coordinate",
        example: 107.6098,
      }),
      isDefault: z.boolean().optional().default(false).meta({
        description: "Indicates if the address is the default address",
        example: false,
      }),
    })
    .meta({
      id: "UpdateAddress",
      description: "Payload for updating an address",
      example: {
        label: "Home Updated",
        address: "789 New Street",
        lat: -6.9147,
        lng: 107.6098,
      },
    });

  static ParamsAddressSchema = z
    .object({
      id: z
        .uuid({
          error: "Address ID must be a valid UUID",
        })
        .meta({
          description: "Address ID (UUID)",
          example: "123e4567-e89b-12d3-a456-426614174000",
        }),
    })
    .meta({
      id: "ParamsAddress",
      description: "Payload for getting an address by ID",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static UserIdSchema = z.uuid().meta({
    description: "User ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  });
}

export type CreateAddressDto = z.infer<
  typeof AddressValidation.CreateAddressSchema
>;
export type UpdateAddressDto = z.infer<
  typeof AddressValidation.UpdateAddressSchema
>;
export type ParamsAddressDto = z.infer<
  typeof AddressValidation.ParamsAddressSchema
>;
export type UserIdDto = z.infer<typeof AddressValidation.UserIdSchema>;
