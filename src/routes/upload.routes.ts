import { Router } from "express";

import * as uploadController from "@/controllers/upload.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/signature", uploadController.getUploadSignature);

export default router;
