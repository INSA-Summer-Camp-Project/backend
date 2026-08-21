import type { Request, Response } from "express";
import * as profileService from "@/services/profile.service";
import type {
  CreateWorkerProfileDto,
  CreatePortfolioItemDto,
  CreateCertificateDto,
} from "@/dtos/profile.dto";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const createWorkerProfile = asyncHandler(
  async (
    req: Request<unknown, unknown, CreateWorkerProfileDto>,
    res: Response,
  ) => {
    const userId = req.user!.id;
    const profile = await profileService.createWorkerProfile(userId, req.body);
    sendSuccess(res, profile, 201);
  },
);

export const addPortfolioItem = asyncHandler(
  async (
    req: Request<unknown, unknown, CreatePortfolioItemDto>,
    res: Response,
  ) => {
    const userId = req.user!.id;
    const portfolioItem = await profileService.addPortfolioItem(
      userId,
      req.body,
    );
    sendSuccess(res, portfolioItem, 201);
  },
);

export const addCertificate = asyncHandler(
  async (
    req: Request<unknown, unknown, CreateCertificateDto>,
    res: Response,
  ) => {
    const userId = req.user!.id;
    const certificate = await profileService.addCertificate(userId, req.body);
    sendSuccess(res, certificate, 201);
  },
);
