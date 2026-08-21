import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import * as telegramController from "@/controllers/telegram.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { UpdateRoleDtoSchema, OnboardUserDtoSchema } from "@/dtos/auth.dto";

const router: Router = Router();

router.get("/me", authenticate, authController.getMe);

router.post("/logout", authController.logout);

router.post(
  "/onboard",
  authenticate,
  validate(OnboardUserDtoSchema),
  authController.onboard,
);

router.post("/refresh", authController.refresh);

router.put(
  "/role",
  authenticate,
  validate(UpdateRoleDtoSchema),
  authController.updateRole,
);

router.get(
  "/admin-only-sample",
  authenticate,
  authorize(["ADMIN"]),
  authController.adminOnlySample,
);

router.post("/telegram", telegramController.verify);

export default router;
