import { Router } from "express";

import * as uploadController from "@/controllers/upload.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { z } from "zod";
import { validate } from "@/middlewares/validate.middleware";

const uploadSignatureSchema = z.object({
  uploadType: z.enum(["profile", "portfolio", "certificate"]),
});

const router: Router = Router();

router.post(
  "/signature",
  authenticate,
  validate(uploadSignatureSchema),
  uploadController.generateSignature,
);
router.delete("/:publicId", authenticate, uploadController.deleteUpload);

export default router;
