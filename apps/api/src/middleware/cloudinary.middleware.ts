/**
 * Cloudinary Upload Middleware
 *
 * This file creates a multer middleware that:
 *   1. Validates the incoming file (correct type? correct extension? not too big?)
 *   2. Streams the file to Cloudinary (our image hosting service)
 *   3. Attaches the Cloudinary URL to req.file.path so the controller can use it
 *
 * The file never stays on our server — it passes through and goes straight to Cloudinary.
 */

import multer from "multer";
import { Request } from "express";
import {
  createCloudinaryStorage,
  CloudinaryUploadOptions,
  imageMimeTypes,
  typeDefaults,
} from "@/utils/cloudinary";
import { HttpError } from "@/utils/httpError";

/**
 * Error codes we return when upload validation fails.
 * The frontend can check these codes to show specific error messages.
 */
const ERROR_CODES = {
  INVALID_MIME: "UPLOAD_INVALID_MIME", // e.g. someone sent a .exe instead of .jpg
  INVALID_FORMAT: "UPLOAD_INVALID_FORMAT", // e.g. MIME type says "image" but extension is ".xyz"
} as const;

/**
 * Creates a multer middleware configured to upload files to Cloudinary.
 *
 * Usage in routes:
 *   cloudinaryUploadMiddleware("avatar", { type: "image", maxSize: 5 })
 *
 * The field name ("avatar") must match what the frontend sends:
 *   formData.append("avatar", file)  ← this "avatar" must match
 *
 * @param fieldName - The FormData field name that contains the file (e.g. "avatar")
 * @param options   - Upload settings like type, max size, allowed formats
 */
export function cloudinaryUploadMiddleware(
  fieldName: string,
  options: CloudinaryUploadOptions = {},
) {
  // Which file type are we accepting? Default to "image".
  // This determines the default max size and allowed formats.
  const type = options.type || "image";

  // Max file size in MB (converts to bytes for multer)
  const maxSize = options.maxSize || typeDefaults[type].maxSize;

  // Which file extensions are allowed? (e.g. ["jpeg", "jpg", "png", "gif"])
  const allowedFormats = options.allowedFormats || typeDefaults[type].formats;

  // Create CloudinaryStorage — this tells multer to stream files
  // to Cloudinary instead of saving them to disk on our server.
  const storage = createCloudinaryStorage(fieldName, options);

  return multer({
    storage,
    limits: {
      fileSize: maxSize * 1024 * 1024, // convert MB to bytes
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      // ── CHECK 1: Is the MIME type correct? ──
      // MIME type is what the browser declares the file as.
      // e.g. "image/jpeg", "image/png", "video/mp4"
      // We check: is this MIME type in our allowed list for this upload type?
      const mimeAllowed = imageMimeTypes[type].includes(file.mimetype);

      if (!mimeAllowed) {
        // e.g. "Only Image files are allowed"
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        cb(
          new HttpError(
            400,
            `Only ${typeName} files are allowed`,
            undefined,
            ERROR_CODES.INVALID_MIME,
          ),
        );
        return;
      }

      // ── CHECK 2: Is the file extension valid? ──
      // Some files lie about their MIME type, so we also check the actual extension.
      // e.g. "photo.jpg" → extension is "jpg"
      const extension = file.originalname.split(".").pop()?.toLowerCase() || "";

      const formatAllowed = allowedFormats.some(
        (format: string) =>
          format.toLowerCase() === extension ||
          // Special case: "jpg" and "jpeg" are the same thing
          (format.toLowerCase() === "jpg" && extension === "jpeg"),
      );

      if (!formatAllowed) {
        // e.g. "Only JPG, PNG, GIF files are allowed"
        const extList = allowedFormats.map((f) => f.toUpperCase()).join(", ");
        cb(
          new HttpError(
            400,
            `Only ${extList} files are allowed`,
            undefined,
            ERROR_CODES.INVALID_FORMAT,
          ),
        );
        return;
      }

      // Both checks passed — let the file through
      cb(null, true);
    },
  }).single(fieldName); // .single() = expect exactly one file in this field
}
