import type { Request, Response } from "express";

import type {
  AdminUserQueryDto,
  CreateCategoryDto,
  UpdateUserRoleDto,
} from "@/dtos/admin.dto";
import * as adminService from "@/services/admin.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getDashboardStatsHandler = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  },
);

export const getAllUsersHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as AdminUserQueryDto;
    const result = await adminService.getAllUsers(query);
    sendSuccess(res, result);
  },
);

export const updateUserRoleHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const body = req.body as UpdateUserRoleDto;

    const updatedUser = await adminService.updateUserRole(userId, body.role);
    sendSuccess(res, updatedUser);
  },
);

export const createCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateCategoryDto;
    const newCategory = await adminService.createCategory(body);
    sendSuccess(res, newCategory, 201);
  },
);

export const deleteCategoryHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.params.id as string;
    const deletedCategory = await adminService.deleteCategory(categoryId);
    sendSuccess(res, deletedCategory);
  },
);
