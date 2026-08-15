import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middlewares/validate.middleware";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import {
  RegisterInputSchema,
  LoginInputSchema,
  RefreshTokenInputSchema,
} from "@/types/auth";

const router: Router = Router();

router.post(
  "/register",
  validate(RegisterInputSchema),
  authController.register,
);

router.post("/login", validate(LoginInputSchema), authController.login);

router.post(
  "/refresh-token",
  validate(RefreshTokenInputSchema),
  authController.refreshToken,
);

router.get("/me", authenticate, authController.getMe);

router.get(
  "/admin-only-sample",
  authenticate,
  authorize(["ADMIN"]),
  authController.adminOnlySample,
);

export default router;
