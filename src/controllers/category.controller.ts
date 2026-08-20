import type { Request, Response } from "express";

import * as categoryService from "@/services/category.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getAllCategories = asyncHandler(
  async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();
    sendSuccess(res, categories);
  },
);
