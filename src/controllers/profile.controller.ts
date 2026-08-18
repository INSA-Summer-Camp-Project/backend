import type { Request, Response, NextFunction } from "express";
import * as profileService from "@/services/profile.service";
import type { ApiResponse } from "@/types/api";
import type {
  CreateWorkerProfileDto,
  CreatePortfolioItemDto,
  CreateCertificateDto,
} from "@/dtos/profile.dto";
import { sendSuccess } from "@/utils/response.util";

export const createWorkerProfile = async (
  req: Request<unknown, unknown, CreateWorkerProfileDto>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await profileService.createWorkerProfile(userId, req.body);
    sendSuccess(res, profile, 201);
  } catch (error) {
    next(error);
  }
};

export const addPortfolioItem = async (
  req: Request<unknown, unknown, CreatePortfolioItemDto>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const portfolioItem = await profileService.addPortfolioItem(
      userId,
      req.body,
    );
    sendSuccess(res, portfolioItem, 201);
  } catch (error) {
    next(error);
  }
};

export const addCertificate = async (
  req: Request<unknown, unknown, CreateCertificateDto>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const certificate = await profileService.addCertificate(userId, req.body);
    sendSuccess(res, certificate, 201);
  } catch (error) {
    next(error);
  }
};
