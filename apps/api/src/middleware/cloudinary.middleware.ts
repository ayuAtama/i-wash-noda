import multer from "multer";
import { Request } from "express";
import {
  createCloudinaryStorage,
  CloudinaryUploadOptions,
  UploadType,
  imageMimeTypes,
  typeDefaults,
} from "@/utils/cloudinary";
import { HttpError } from "@/utils/httpError";

const typeMimeTypes: Record<UploadType, string[]> = {
  image: imageMimeTypes.image,
  video: imageMimeTypes.video,
  audio: imageMimeTypes.audio,
  document: imageMimeTypes.document,
};

export function cloudinaryUploadMiddleware(
  fieldName: string,
  options: CloudinaryUploadOptions = {},
) {
  const type = options.type || "image";
  const maxSize = options.maxSize || typeDefaults[type].maxSize;
  const allowedFormats = options.allowedFormats || typeDefaults[type].formats;

  const storage = createCloudinaryStorage(fieldName, options);

  return multer({
    storage,
    limits: {
      fileSize: maxSize * 1024 * 1024,
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback,
    ) => {
      const typeMimes = typeMimeTypes[type];
      const mimeAllowed = typeMimes.includes(file.mimetype);

      if (!mimeAllowed) {
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        cb(new HttpError(400, `Only ${typeName} files are allowed`));
        return;
      }

      const extension = file.originalname.split(".").pop()?.toLowerCase() || "";
      const formatAllowed = allowedFormats.some(
        (f: string) =>
          f.toLowerCase() === extension ||
          (f.toLowerCase() === "jpg" && extension === "jpeg"),
      );

      if (!formatAllowed) {
        const extList = allowedFormats.map((f) => f.toUpperCase()).join(", ");
        cb(new HttpError(400, `Only ${extList} files are allowed`));
        return;
      }

      if (type === "image" && (options.minWidth || options.minHeight)) {
        const sharp = require("sharp");
        const sizeError = (message: string) => {
          cb(new HttpError(400, message));
        };

        sharp(file.buffer)
          .metadata()
          .then((metadata: { width?: number; height?: number }) => {
            const { width = 0, height = 0 } = metadata;

            if (options.minWidth && width < options.minWidth) {
              sizeError(
                `Image must be at least ${options.minWidth}x${options.minHeight || options.minWidth} pixels`,
              );
              return;
            }
            if (options.minHeight && height < options.minHeight) {
              sizeError(
                `Image must be at least ${options.minWidth || options.minHeight}x${options.minHeight} pixels`,
              );
              return;
            }

            cb(null, true);
          })
          .catch(() => {
            cb(new HttpError(400, "Failed to read image dimensions"));
          });
        return;
      }

      cb(null, true);
    },
  }).single(fieldName);
}
