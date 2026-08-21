import { Router } from "express";
import * as adminController from "@/controllers/admin.controller";
import {
  AdminUserQueryDtoSchema,
  CreateCategoryDtoSchema,
  UpdateUserRoleDtoSchema,
} from "@/dtos/admin.dto";
import { authenticate, authorize } from "@/middlewares/auth.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

router.use(authenticate);
router.use(authorize(["ADMIN"]));

router.get("/stats", adminController.getDashboardStats);
router.get(
  "/users",
  validate(AdminUserQueryDtoSchema, "query"),
  adminController.getAllUsers,
);
router.patch(
  "/users/:id/role",
  validate(UpdateUserRoleDtoSchema),
  adminController.updateUserRole,
);
router.post(
  "/categories",
  validate(CreateCategoryDtoSchema),
  adminController.createCategory,
);
router.delete("/categories/:id", adminController.deleteCategory);

export default router;
