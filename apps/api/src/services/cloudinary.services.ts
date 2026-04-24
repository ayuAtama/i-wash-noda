import cloudinary from "@/utils/cloudinary";
import {
  CloudinaryUploadResponse,
  SignatureResponse,
} from "@/types/cloudinary";
import { getUnixTime } from "date-fns/getUnixTime";

export class CloudinaryService {
  async getSignature(userId: string, folder: string) {
    try {
      // getUnixTime automatically gets the current time in seconds,
      // eliminating the need for division or rounding!
      const timestamp = getUnixTime(new Date());

      // the parameters that need to be signed
      const paramsToSign = {
        timestamp: timestamp,
        public_id: `avatar_${userId}`,
        folder: folder, // /profile
        overwrite: true, // for prevent user make a same upload flood the cloudinary.
        allowed_formats: ["jpg", "png", "jpeg"],
      };

      // sign the parameters
      const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET! as string,
      );

      // return the signature to controller
      return {
        public_id: paramsToSign.public_id,
        timestamp,
        signature,
        folder: "/profile",
        cloudName: process.env.CLOUDINARY_CLOUD_NAME! as string,
        apiKey: process.env.CLOUDINARY_API_KEY! as string,
      };
    } catch (error) {
      throw error;
    }
  }
}
