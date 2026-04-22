import { authenticationMiddleware } from "@/middleware/authentication";
import { Router } from "express";
import { CloudinaryController } from "@/controllers/cloudinary.controller";
import { CloudinaryService } from "@/services/cloudinary.services";

export class CloudinaryRoute {
  public router = Router();
  private controller: CloudinaryController;

  constructor() {
    this.controller = new CloudinaryController(new CloudinaryService());
    this.getSignature();
  }

  private getSignature() {
    this.router.get(
      "/get-upload-signature",
      this.controller.getUploadSignature,
    );
  }
}

export default new CloudinaryRoute().router;
