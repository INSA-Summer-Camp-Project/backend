import { Router } from "express";

import * as authController from "@/controllers/auth.controller";
import * as telegramController from "@/controllers/telegram.controller";
import { UpdateRoleDtoSchema } from "@/dtos/auth.dto";
import { authenticate } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

router.get("/me", authenticate, authController.getMe);

router.post("/logout", authenticate, authController.logout);

router.put(
  "/role",
  authenticate,
  validate(UpdateRoleDtoSchema),
  authController.updateRole,
);

router.get("/telegram", telegramController.login);

router.get("/telegram/callback", telegramController.callback);

export default router;
