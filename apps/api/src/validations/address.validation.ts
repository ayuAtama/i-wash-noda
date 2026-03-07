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
      city: z.string().meta({
        description: "City name",
        example: "Jakarta",
      }),
      province: z.string().meta({
        description: "Province name",
        example: "DKI Jakarta",
      }),
      postalCode: z.string().optional().meta({
        description: "Postal code",
        example: "12345",
      }),
      lat: z.number().meta({
        description: "Latitude coordinate",
        example: -6.2088,
      }),
      lng: z.number().meta({
        description: "Longitude coordinate",
        example: 106.8456,
      }),
    })
    .meta({
      id: "CreateAddress",
      description: "Payload for creating a new address",
      example: {
        label: "Home",
        address: "123 Main St",
        city: "Jakarta",
        province: "DKI Jakarta",
        postalCode: "12345",
        lat: -6.2088,
        lng: 106.8456,
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
      city: z.string().optional().meta({
        description: "City name",
        example: "Bandung",
      }),
      province: z.string().optional().meta({
        description: "Province name",
        example: "Jawa Barat",
      }),
      postalCode: z.string().optional().meta({
        description: "Postal code",
        example: "12346",
      }),
      lat: z.number().optional().meta({
        description: "Latitude coordinate",
        example: -6.9147,
      }),
      lng: z.number().optional().meta({
        description: "Longitude coordinate",
        example: 107.6098,
      }),
    })
    .meta({
      id: "UpdateAddress",
      description: "Payload for updating an address",
      example: {
        label: "Home Updated",
        address: "789 New Street",
        city: "Bandung",
        province: "Jawa Barat",
      },
    });
}

export type CreateAddressDto = z.infer<
  typeof AddressValidation.CreateAddressSchema
>;
export type UpdateAddressDto = z.infer<
  typeof AddressValidation.UpdateAddressSchema
>;
