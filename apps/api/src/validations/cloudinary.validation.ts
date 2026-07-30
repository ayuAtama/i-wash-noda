import { z } from "zod";
import "zod-openapi";

// check if only the folder allowed
export const CLOUDINARY_FOLDER = [
  "avatars",
  "payment-proofs",
  "complaints",
] as const;
export class CloudinaryValidation {
  static RequestSignatureSchema = z
    .object({
      folder: z.enum(CLOUDINARY_FOLDER).meta({
        description: "Folder name",
        example: "/avatars",
      }),
      params: z.string().optional().meta({
        description: "Additional parameters (UUID or somthing)",
        example: "1234-39991-299400-2939",
      }),
      unique: z.boolean().optional().meta({
        description: "Unique file name signature (not overwrite)",
        example: true,
      }),
    })
    .meta({
      id: "RequstSignature",
      description: "Payload for requesting signature",
      example: {
        folder: "/avatars",
      },
    });

  static CloudinarySignatureServiceSchema = z
    .object({
      userId: z.string().meta({
        description: "User ID requesting the signature",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      folder: z.enum(CLOUDINARY_FOLDER).meta({
        description: "Folder name",
        example: "avatars",
      }),
      params: z.string().optional().meta({
        description: "Additional parameters (UUID or something)",
        example: "1234-39991-299400-2939",
      }),
      unique: z.boolean().optional().meta({
        description: "Unique file name signature (not overwrite)",
        example: true,
      }),
    })
    .meta({
      id: "CloudinarySignatureService",
      description:
        "Payload for generating cloudinary signature (service-level)",
      example: {
        userId: "123e4567-e89b-12d3-a456-426614174000",
        folder: "avatars",
      },
    });
}

export type RequestSignatureDto = z.infer<
  typeof CloudinaryValidation.RequestSignatureSchema
>;
export type CloudinarySignatureServiceDto = z.infer<
  typeof CloudinaryValidation.CloudinarySignatureServiceSchema
>;
