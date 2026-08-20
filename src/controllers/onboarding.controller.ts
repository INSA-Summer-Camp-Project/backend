import type { Request, Response } from "express";

import * as onboardingService from "@/services/onboarding.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { CompleteOnboardingDtoSchema } from "@/dtos/onboarding.dto";

export const getOnboardingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await onboardingService.getOnboardingStatus(req.user!.id);
    sendSuccess(res, result, 200);
  },
);

export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response) => {
    const dto = CompleteOnboardingDtoSchema.parse(req.body);
    const result = await onboardingService.completeOnboarding(
      req.user!.id,
      dto,
    );
    sendSuccess(res, result, 200);
  },
);
