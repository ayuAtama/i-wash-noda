import { z } from "zod";
import "zod-openapi";

// check if only the folder allowed
export const CLOUDINARY_FOLDER = ["avatars", "payment-proofs"] as const;
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
    })
    .meta({
      id: "RequstSignature",
      description: "Payload for requesting signature",
      example: {
        folder: "/avatars",
      },
    });
}

//eport type to dto to checking in controller
export type RequestSignatureDto = z.infer<
  typeof CloudinaryValidation.RequestSignatureSchema
>;
