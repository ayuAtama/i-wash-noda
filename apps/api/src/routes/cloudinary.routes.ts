import { authenticationMiddleware } from "@/middleware/authentication";
import { Router } from "express";
import { CloudinaryController } from "@/controllers/cloudinary.controller";
import { RateLimiter } from "@/middleware/rateLimitter";
import { Validator } from "@/middleware/validate";
import { CloudinaryValidation } from "@/validations/cloudinary.validation";
import { CloudinaryService } from "@/services/cloudinary.services";

export class CloudinaryRoute {
  public router = Router();
  private controller: CloudinaryController;

  constructor(controller: CloudinaryController) {
    this.controller = controller;
    this.getSignature();
  }

  private getSignature() {
    this.router.get(
      "/:folder{/:params}{/:unique}",
      authenticationMiddleware.handler,
      Validator.validate({
        params: CloudinaryValidation.RequestSignatureSchema,
      }),
      RateLimiter.create(5),
      this.controller.getUploadSignature,
    );
  }
}

export default new CloudinaryRoute(
  new CloudinaryController(new CloudinaryService()),
).router;
