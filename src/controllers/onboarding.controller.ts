import type { Request, Response } from "express";

import type { CompleteOnboardingDto } from "@/dtos/onboarding.dto";
import * as onboardingService from "@/services/onboarding.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getOnboardingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const status = await onboardingService.getOnboardingStatus(userId);
    sendSuccess(res, status);
  },
);

export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const dto = req.body as CompleteOnboardingDto;
    const user = await onboardingService.completeOnboarding(userId, dto);
    sendSuccess(res, user);
  },
);
