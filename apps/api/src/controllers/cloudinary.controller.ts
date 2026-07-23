// src/controllers/cloudinary.controller.ts
import type { Request, Response, NextFunction } from "express";
import { CloudinaryService } from "@/services/cloudinary.services";
import { HttpError } from "@/utils/httpError";
import { RequestSignatureDto } from "@/validations/cloudinary.validation";

export class CloudinaryController {
  private cloudinaryService: CloudinaryService;

  constructor(cloudinaryService: CloudinaryService) {
    this.cloudinaryService = cloudinaryService;
  }

  getUploadSignature = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // get the userid from either access_token(Better auth) or user id (JWT)
      const userId = req.access_token?.sub ?? req.user?.id;
      if (!userId) throw new HttpError(401, "Unauthorized, login first");

      // get the payload from the request
      const { folder, params } = req.validated!.params as RequestSignatureDto;

      // call the service to get the signature
      const signatureData = await this.cloudinaryService.getSignature(
        userId,
        folder,
        params,
      );

      // response
      res.status(200).json(signatureData);
    } catch (err) {
      next(err);
    }
  };
}
