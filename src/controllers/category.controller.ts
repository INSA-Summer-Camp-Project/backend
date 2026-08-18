import type { Request, Response, NextFunction } from "express";
import * as categoryService from "@/services/category.service";
import type { ApiResponse } from "@/types/api";
import { sendSuccess } from "@/utils/response.util";

export const getCategories = async (
  _req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const categories = await categoryService.getAllCategories();
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};
