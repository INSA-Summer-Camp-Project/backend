import { Router } from "express";
import * as categoryController from "@/controllers/category.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const router: Router = Router();

router.get("/", authenticate, categoryController.getCategories);

export default router;
