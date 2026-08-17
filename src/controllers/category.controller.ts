import type { NextFunction, Request, Response } from "express";

import * as categoryService from "@/services/category.service";
import { sendSuccess } from "@/utils/response.util";

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const categories = await categoryService.getAllCategories();
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};
