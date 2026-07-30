// apps/api/src/services/cloudinary.services.ts
import cloudinary from "@/utils/cloudinary";
import { getUnixTime } from "date-fns/getUnixTime";
import { CloudinarySignatureServiceDto } from "@/validations/cloudinary.validation";

type CloudinaryInstance = typeof cloudinary;

export class CloudinaryService {
  private readonly cloudinary: CloudinaryInstance;

  constructor(cloudinaryClient: CloudinaryInstance = cloudinary) {
    this.cloudinary = cloudinaryClient;
  }

  public async getSignature(
    userId: CloudinarySignatureServiceDto["userId"],
    folder: CloudinarySignatureServiceDto["folder"],
    params?: CloudinarySignatureServiceDto["params"],
    unique?: CloudinarySignatureServiceDto["unique"],
  ) {
    try {
      const timestamp = getUnixTime(new Date());

      const paramsToSign = {
        timestamp: timestamp,
        public_id: `${folder}_${userId}${params ? `_${params}` : ""}${unique ? `_${timestamp}` : ""}`,
        overwrite: true,
        folder: `/${folder}`,
        allowed_formats: ["jpg", "png", "jpeg", "pdf"],
      };

      const signature = this.cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET! as string,
      );

      return {
        success: true,
        message: `Signature for ${folder}_${userId}${params ? `_${params}` : ""}${unique ? `_${timestamp}` : ""} generated successfully`,
        data: {
          public_id: paramsToSign.public_id,
          timestamp,
          signature,
          folder: `/${folder}`,
          overwrite: true,
          allowed_formats: ["jpg", "png", "jpeg", "pdf"],
          cloudName: process.env.CLOUDINARY_CLOUD_NAME! as string,
          apiKey: process.env.CLOUDINARY_API_KEY! as string,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
