import type { Request, Response } from "express";
import * as categoryService from "@/services/category.service";
import type { CreateCategoryDto } from "@/dtos/category.dto";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const getCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();
    sendSuccess(res, categories);
  },
);

export const createCategory = asyncHandler(
  async (req: Request<unknown, unknown, CreateCategoryDto>, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    sendSuccess(res, category, 201);
  },
);
