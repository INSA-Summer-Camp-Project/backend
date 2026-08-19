import type { Request, Response } from "express";

import * as profileService from "@/services/profile.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const updateWorkerProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const dto = req.body;
    const updatedProfile = await profileService.updateWorkerProfile(
      userId,
      dto,
    );
    sendSuccess(res, updatedProfile);
  },
);

export const addPortfolioItem = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const dto = req.body;
    const portfolioItem = await profileService.addPortfolioItem(userId, dto);
    sendSuccess(res, portfolioItem, 201);
  },
);

export const addCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const dto = req.body;
    const certificate = await profileService.addCertificate(userId, dto);
    sendSuccess(res, certificate, 201);
  },
);
