// src/controllers/cloudinary.controller.ts
import type { Request, Response, NextFunction } from "express";
import { CloudinaryService } from "@/services/cloudinary.services";

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
      //get the folder from the query params (for now /profile)
      const folder = req.query.folder as string;

      // call the service to get the signature
      const signatureData = await this.cloudinaryService.getSignature(folder);

      // response
      res.status(200).json({
        success: true,
        message: "Signature generated successfully",
        data: signatureData,
      });
    } catch (err) {
      next(err);
    }
  };
}
