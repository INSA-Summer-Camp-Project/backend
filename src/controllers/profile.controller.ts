import type { NextFunction, Request, Response } from "express";

import * as profileService from "@/services/profile.service";
import { sendSuccess } from "@/utils/response.util";

export const updateWorkerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const dto = req.body;
    const updatedProfile = await profileService.updateWorkerProfile(
      userId,
      dto,
    );
    sendSuccess(res, updatedProfile);
  } catch (error) {
    next(error);
  }
};

export const addPortfolioItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const dto = req.body;
    const portfolioItem = await profileService.addPortfolioItem(userId, dto);
    sendSuccess(res, portfolioItem, 201);
  } catch (error) {
    next(error);
  }
};

export const addCertificate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const dto = req.body;
    const certificate = await profileService.addCertificate(userId, dto);
    sendSuccess(res, certificate, 201);
  } catch (error) {
    next(error);
  }
};
