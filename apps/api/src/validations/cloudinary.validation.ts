import { z } from "zod";
import "zod-openapi";

// check if only the folder allowed
export const CLOUDINARY_FOLDER = ["/avatars", "/banners"] as const;
export class CloudinaryValidation {
  static RequestSignatureSchema = z
    .object({
      folder: z.enum(CLOUDINARY_FOLDER).meta({
        description: "Folder name",
        example: "/avatars",
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
