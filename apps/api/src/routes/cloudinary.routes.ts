import { authenticationMiddleware } from "@/middleware/authentication";
import { Router } from "express";
import { CloudinaryController } from "@/controllers/cloudinary.controller";
import { CloudinaryService } from "@/services/cloudinary.services";
import rateLimiter from "@/middleware/rateLimitter";
import { Validator } from "@/middleware/validate";
import { CloudinaryValidation } from "@/validations/cloudinary.validation";

export class CloudinaryRoute {
  public router = Router();
  private controller: CloudinaryController;

  constructor() {
    this.controller = new CloudinaryController(new CloudinaryService());
    this.getSignature();
  }

  private getSignature() {
    this.router.get(
      "/",
      authenticationMiddleware,
      Validator.validate({
        body: CloudinaryValidation.RequestSignatureSchema,
      }),
      rateLimiter(5),
      this.controller.getUploadSignature,
    );
  }
}

export default new CloudinaryRoute().router;
