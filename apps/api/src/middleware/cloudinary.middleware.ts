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

const ERROR_CODES = {
  INVALID_MIME: "UPLOAD_INVALID_MIME",
  INVALID_FORMAT: "UPLOAD_INVALID_FORMAT",
} as const;

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

      const extension = file.originalname.split(".").pop()?.toLowerCase() || "";
      const formatAllowed = allowedFormats.some(
        (f: string) =>
          f.toLowerCase() === extension ||
          (f.toLowerCase() === "jpg" && extension === "jpeg"),
      );

      if (!formatAllowed) {
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

      cb(null, true);
    },
  }).single(fieldName);
}
