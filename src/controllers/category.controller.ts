import type { Request, Response, NextFunction } from "express";
import * as categoryService from "@/services/category.service";
import { sendSuccess } from "@/utils/response.util";
import type { CreateCategoryDto } from "@/dtos/category.dto";

export const getCategories = async (
  _req: Request,
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

export const createCategory = async (
  req: Request<unknown, unknown, CreateCategoryDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const category = await categoryService.createCategory(req.body);
    sendSuccess(res, category, 201);
  } catch (error) {
    next(error);
  }
};
