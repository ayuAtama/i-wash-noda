import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import "dotenv/config";

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadType = "image" | "video" | "audio" | "document";

export interface CloudinaryUploadOptions {
  type?: UploadType;
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: string[];
}

export const typeDefaults: Record<
  UploadType,
  { maxSize: number; formats: string[] }
> = {
  image: {
    maxSize: 2,
    formats: [
      "jpeg",
      "jpg",
      "png",
      "gif",
      "webp",
      "svg",
      "bmp",
      "tiff",
      "heic",
    ],
  },
  video: { maxSize: 50, formats: ["mp4", "webm", "mkv", "avi", "mov"] },
  audio: { maxSize: 10, formats: ["mp3", "wav", "ogg", "m4a", "flac"] },
  document: {
    maxSize: 10,
    formats: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"],
  },
};

export const imageMimeTypes: Record<string, string[]> = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
    "image/heic",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/x-matroska",
    "video/avi",
    "video/quicktime",
  ],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/flac"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "application/rtf",
  ],
};

export function createCloudinaryStorage(
  fieldName: string,
  options: CloudinaryUploadOptions = {},
) {
  const type = options.type || "image";
  const shouldResize = type === "image";

  const params: Record<string, any> = {
    folder: fieldName,
    allowed_formats: options.allowedFormats || typeDefaults[type].formats,
  };

  if (shouldResize && options.maxWidth && options.maxHeight) {
    params.transformation = [
      { width: options.maxWidth, height: options.maxHeight, crop: "limit" },
    ];
  }

  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params,
  });
}

export { cloudinary };
export default cloudinary;

export async function deleteImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
    return;
  }

  const publicIdMatch = imageUrl.match(/\/upload\/(.+)\./);
  if (!publicIdMatch || !publicIdMatch[1]) {
    return;
  }

  const publicId = publicIdMatch[1];
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
  }
}

