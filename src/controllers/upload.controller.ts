import type { Request, Response } from "express";

import * as uploadService from "@/services/upload.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const generateSignature = asyncHandler(
  async (req: Request, res: Response) => {
    const { uploadType } = req.body;
    const result = uploadService.generateUploadSignature(
      req.user!.id,
      uploadType,
    );
    sendSuccess(res, result, 200);
  },
);

export const deleteUpload = asyncHandler(
  async (req: Request, res: Response) => {
    const publicId = req.params.publicId as string;
    const result = await uploadService.deleteFile(publicId, req.user!.id);
    sendSuccess(res, result, 200);
  },
);
