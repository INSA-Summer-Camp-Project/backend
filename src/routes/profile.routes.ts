import { Router } from "express";
import * as profileController from "@/controllers/profile.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  CreateWorkerProfileDtoSchema,
  CreatePortfolioItemDtoSchema,
  CreateCertificateDtoSchema,
} from "@/dtos/profile.dto";

const router: Router = Router();

router.post(
  "/worker",
  authenticate,
  validate(CreateWorkerProfileDtoSchema),
  profileController.createWorkerProfile,
);

router.post(
  "/worker/portfolio",
  authenticate,
  validate(CreatePortfolioItemDtoSchema),
  profileController.addPortfolioItem,
);

router.post(
  "/worker/certificates",
  authenticate,
  validate(CreateCertificateDtoSchema),
  profileController.addCertificate,
);

export default router;
