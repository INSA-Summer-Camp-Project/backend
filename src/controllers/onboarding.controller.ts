import type { Request, Response } from "express";

import * as onboardingService from "@/services/onboarding.service";
import * as authService from "@/services/auth.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { CompleteOnboardingDtoSchema } from "@/dtos/onboarding.dto";
import { stringifySetCookie } from "cookie";
import { env } from "@/config/env";

export const getOnboardingStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await onboardingService.getOnboardingStatus(req.user!.id);
    sendSuccess(res, result, 200);
  },
);

export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response) => {
    const dto = CompleteOnboardingDtoSchema.parse(req.body);
    const user = await onboardingService.completeOnboarding(
      req.user!.id,
      dto,
    );
    const tokens = await authService.generateTokenPair(user!.id, user!.systemRole, user!.isOnboarded, user!.lastActiveRole);

    const isProduction = env.NODE_ENV === "production";

    res.append(
      "Set-Cookie",
      stringifySetCookie({
        name: "access_token",
        value: tokens.accessToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 mins
      }),
    );

    if (tokens.refreshToken) {
      res.append(
        "Set-Cookie",
        stringifySetCookie({
          name: "refresh_token",
          value: tokens.refreshToken,
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        }),
      );
    }

    sendSuccess(res, { user }, 200);
  },
);
