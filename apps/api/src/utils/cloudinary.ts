import { v2 as cloudinary } from "cloudinary";

export class CloudinaryClient {
  private static instance: typeof cloudinary;

  private constructor() {
    // cloudinary config
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  // get the configured instance
  static getInstance(): typeof cloudinary {
    if (!CloudinaryClient.instance) {
      new CloudinaryClient();
      CloudinaryClient.instance = cloudinary;
    }
    return CloudinaryClient.instance;
  }
}

// export the configured instance
export default CloudinaryClient.getInstance();
