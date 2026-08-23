import type { Request, Response } from "express";
import type {
  AdminUserQueryDto,
  CreateCategoryDto,
  UpdateUserRoleDto,
} from "@/dtos/admin.dto";
import * as adminService from "@/services/admin.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getDashboardStats = asyncHandler(
  async (_req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  },
);

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AdminUserQueryDto;
  const result = await adminService.getAllUsers(query);
  sendSuccess(res, result.users, 200, {
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = String(req.params.id);
    const body = req.body as UpdateUserRoleDto;
    const updatedUser = await adminService.updateUserRole(
      req.user!.id,
      userId,
      body.role,
    );
    sendSuccess(res, updatedUser);
  },
);

export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body as CreateCategoryDto;
    const newCategory = await adminService.createCategory(body);
    sendSuccess(res, newCategory, 201);
  },
);

export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const categoryId = String(req.params.id);
    const deletedCategory = await adminService.deleteCategory(categoryId);
    sendSuccess(res, deletedCategory);
  },
);
