import type { Request, Response } from "express";

import * as uploadService from "@/services/upload.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getUploadSignature = asyncHandler(
  async (req: Request, res: Response) => {
    const { uploadType } = req.query;
    const userId = req.user!.id;
    const result = uploadService.generateUploadSignature(
      userId,
      uploadType as "profile" | "portfolio" | "certificate",
    );
    sendSuccess(res, result);
  },
);

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.body;
  const userId = req.user!.id;
  const result = await uploadService.deleteFile(publicId, userId);
  sendSuccess(res, result);
});
