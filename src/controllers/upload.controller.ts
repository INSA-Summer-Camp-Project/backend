import type { Request, Response } from "express";

import * as uploadService from "@/services/upload.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getUploadSignature = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = uploadService.generateUploadSignature();
    sendSuccess(res, result);
  },
);
