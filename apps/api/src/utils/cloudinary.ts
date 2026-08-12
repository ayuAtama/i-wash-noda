/**
 * Cloudinary Utilities
 *
 * Cloudinary is a cloud service that stores images (and videos, documents, etc.).
 * We use it for user avatars, payment proofs, and any other uploaded files.
 *
 * This file provides:
 *   - cloudinary: configured Cloudinary client (connects to our Cloudinary account)
 *   - createCloudinaryStorage(): creates a multer storage that streams files to Cloudinary
 *   - deleteImage(): deletes an image from Cloudinary by its URL
 */

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import "dotenv/config";

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

// ── Types & Interfaces ──

/** What kind of file are we uploading? This determines default max size and formats. */
export type UploadType = "image" | "video" | "audio" | "document";

/** Options for configuring an upload (all optional — defaults are fine for most cases) */
export interface CloudinaryUploadOptions {
  type?: UploadType; // e.g. "image" — default is "image"
  maxSize?: number; // max file size in MB — default depends on type
  maxWidth?: number; // resize to this width (images only)
  maxHeight?: number; // resize to this height (images only)
  allowedFormats?: string[]; // override which file extensions are allowed
}

// ── Default limits per file type ──
// These are the fallback values when you don't specify custom options.
export const typeDefaults: Record<
  UploadType,
  { maxSize: number; formats: string[] }
> = {
  image: {
    maxSize: 2, // 2MB default for images
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

// ── MIME types per file type ──
// MIME types are what browsers use to describe files.
// e.g. "image/jpeg" for .jpg files, "video/mp4" for .mp4 files
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

// ── Storage Factory ──

/**
 * Creates a CloudinaryStorage instance for multer.
 *
 * Instead of saving files to disk on our server, this streams them directly to Cloudinary.
 * The `fieldName` becomes the Cloudinary folder name (e.g. "avatar" → folder: /avatar).
 *
 * If maxWidth and maxHeight are provided, images are resized before uploading.
 * The "limit" crop mode means: scale down to fit within the box, but don't stretch.
 *
 * @param fieldName - Cloudinary folder name (e.g. "avatar", "payment-proof")
 * @param options   - Upload configuration
 */
export function createCloudinaryStorage(
  fieldName: string,
  options: CloudinaryUploadOptions = {},
) {
  const type = options.type || "image";

  const params: Record<string, any> = {
    folder: fieldName, // Cloudinary folder: /avatar, /payment-proof, etc.
    allowed_formats: options.allowedFormats || typeDefaults[type].formats,
  };

  // Only resize images — videos and documents are uploaded as-is
  if (type === "image" && options.maxWidth && options.maxHeight) {
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

// ── Delete Image ──

/**
 * Deletes an image from Cloudinary using its URL.
 *
 * How it works:
 *   Cloudinary URLs look like this:
 *   https://res.cloudinary.com/demo/image/upload/v1/avatar/photo.jpg
 *                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *                                 This part is the "public_id"
 *
 *   We use a regex to extract everything between "/upload/" and the last "."
 *   Then call cloudinary.uploader.destroy() with that public_id.
 *
 * @param imageUrl - The full Cloudinary URL of the image to delete
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  // Safety check: only delete images from Cloudinary (never delete external URLs)
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
    return;
  }

  // Extract the public_id from the URL.
  // Example: "https://res.cloudinary.com/demo/image/upload/v1/avatar/photo.jpg"
  //          regex captures: "v1/avatar/photo"
  //
  // The regex /\/upload\/(.+)\./ works like this:
  //   \/upload\/  → matches the literal text "/upload/"
  //   (.+)        → captures everything after it (this is the public_id)
  //   \.          → stops at the last dot (before the file extension)
  const publicIdMatch = imageUrl.match(/\/upload\/(.+)\./);

  if (!publicIdMatch || !publicIdMatch[1]) {
    return; // URL format not recognized — don't try to delete
  }

  const publicId = publicIdMatch[1]; // e.g. "v1/avatar/photo"

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // If deletion fails, log it but don't crash the app.
    // The image will just stay on Cloudinary (not ideal but not critical).
    console.error("Failed to delete image from Cloudinary:", error);
  }
}
