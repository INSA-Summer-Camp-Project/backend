import type { NextFunction, Request, Response } from "express";

import * as uploadService from "@/services/upload.service";
import { sendSuccess } from "@/utils/response.util";

export const getUploadSignature = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const result = uploadService.generateUploadSignature();
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
