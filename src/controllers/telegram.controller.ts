import type { Request, Response, NextFunction } from "express";
import { stringifySetCookie } from "cookie";

import * as telegramService from "@/services/telegram.service";
import * as authService from "@/services/auth.service";

import { env } from "@/config/env";
import { UnauthorizedError } from "@/middlewares/error.middleware";

export const verify = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken || typeof idToken !== "string") {
      throw new UnauthorizedError("Missing or invalid idToken");
    }

    const telegramIdentity =
      await telegramService.verifyTelegramIdToken(idToken);
    const result = await authService.loginWithTelegram(telegramIdentity);

    const isProduction = env.NODE_ENV === "production";

    res.append(
      "Set-Cookie",
      stringifySetCookie({
        name: "access_token",
        value: result.tokens.accessToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60, // 15 mins
      }),
    );

    if (result.tokens.refreshToken) {
      res.append(
        "Set-Cookie",
        stringifySetCookie({
          name: "refresh_token",
          value: result.tokens.refreshToken,
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        }),
      );
    }

    res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    next(error);
  }
};
