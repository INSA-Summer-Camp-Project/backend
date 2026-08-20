import { Router } from "express";

import * as adminController from "@/controllers/admin.controller";
import {
  AdminUserQueryDtoSchema,
  CreateCategoryDtoSchema,
  UpdateUserRoleDtoSchema,
} from "@/dtos/admin.dto";
import { authenticate } from "@/middlewares/auth.middleware";
import { authorize } from "@/middlewares/authorization.middleware";
import { validate } from "@/middlewares/validate.middleware";

const router: Router = Router();

// All admin routes are protected by authentication and the ADMIN system role
router.use(authenticate);
router.use(authorize(["ADMIN"]));

// Platform Analytics
router.get("/stats", adminController.getDashboardStatsHandler);

// User Management
router.get(
  "/users",
  validate({ query: AdminUserQueryDtoSchema }),
  adminController.getAllUsersHandler,
);
router.patch(
  "/users/:id/role",
  validate({ body: UpdateUserRoleDtoSchema }),
  adminController.updateUserRoleHandler,
);

// Platform Categories Management
router.post(
  "/categories",
  validate({ body: CreateCategoryDtoSchema }),
  adminController.createCategoryHandler,
);
router.delete("/categories/:id", adminController.deleteCategoryHandler);

export default router;
