import { Router } from "express";
import * as categoryController from "@/controllers/category.controller";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";
import { CreateCategorySchema } from "@/dtos/category.dto";

const router: Router = Router();

router.get("/", categoryController.getCategories);

router.post(
  "/",
  authenticate,
  authorize(["ADMIN"]),
  validate(CreateCategorySchema),
  categoryController.createCategory,
);

export default router;
