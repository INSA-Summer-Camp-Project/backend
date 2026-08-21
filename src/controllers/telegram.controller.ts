import type { Request, Response, NextFunction } from "express";
import { stringifySetCookie } from "cookie";

import * as telegramService from "@/services/telegram.service";
import * as authService from "@/services/auth.service";

import { env } from "@/config/env";
import { UnauthorizedError } from "@/middlewares/error.middleware";

export const getAuthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authData = await telegramService.generateTelegramAuthUrl();
    res.status(200).json({
      success: true,
      data: authData,
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { currentUrl, state, codeVerifier } = req.body;

    if (!currentUrl || typeof currentUrl !== "string") {
      throw new UnauthorizedError("Missing or invalid currentUrl");
    }
    if (!state || typeof state !== "string") {
      throw new UnauthorizedError("Missing or invalid state");
    }
    if (!codeVerifier || typeof codeVerifier !== "string") {
      throw new UnauthorizedError("Missing or invalid codeVerifier");
    }

    console.log("verify endpoint hit with:", { currentUrl, state, codeVerifier });

    console.log("Calling telegramService.verifyTelegramCode...");
    const telegramIdentity = await telegramService.verifyTelegramCode(currentUrl, state, codeVerifier);
    console.log("telegramIdentity received:", telegramIdentity);

    console.log("Calling authService.loginWithTelegram...");
    const result = await authService.loginWithTelegram(telegramIdentity);
    console.log("Login successful for user:", result.user.id);

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
