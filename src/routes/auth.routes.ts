import { Router } from "express";
import * as authController from "@/controllers/auth.controller";
import * as telegramController from "@/controllers/telegram.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/me", authenticate, authController.getMe);

router.get(
  "/admin-only-sample",
  authenticate,
  authorize(["ADMIN"]),
  authController.adminOnlySample,
);

router.get("/telegram", telegramController.login);

router.get("/telegram/callback", telegramController.callback);

export default router;
