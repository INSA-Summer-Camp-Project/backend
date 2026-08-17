import { stringifySetCookie } from "cookie";
import type { NextFunction, Request, Response } from "express";

import { env } from "@/config/env";
import {
  generateTelegramNonce,
  generateTelegramPkce,
  generateTelegramState,
} from "@/lib/telegram-oidc";
import {
  clearTelegramOidcTransaction,
  getTelegramOidcTransaction,
  setTelegramOidcTransaction,
} from "@/lib/telegram-oidc-cookie";
import { UnauthorizedError } from "@/middlewares/error.middleware";
import * as authService from "@/services/auth.service";
import * as telegramService from "@/services/telegram.service";

export const login = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const state = generateTelegramState();
    const nonce = generateTelegramNonce();

    const { codeVerifier, codeChallenge } = await generateTelegramPkce();

    const authorizationUrl = await telegramService.createAuthorizationUrl(
      state,
      codeChallenge,
      nonce,
    );

    setTelegramOidcTransaction(res, {
      state,
      codeVerifier,
      nonce,
    });

    res.redirect(authorizationUrl.href);
  } catch (error) {
    next(error);
  }
};

export const callback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const transaction = getTelegramOidcTransaction(req);

    if (!transaction) {
      throw new UnauthorizedError(
        "Telegram authentication session expired or is invalid",
      );
    }

    const callbackUrl = new URL(env.TELEGRAM_REDIRECT_URI);

    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        callbackUrl.searchParams.set(key, value);
      }
    }

    const telegramIdentity = await telegramService.handleCallback(
      callbackUrl,
      transaction.state,
      transaction.codeVerifier,
      transaction.nonce,
    );

    const result = await authService.loginWithTelegram(telegramIdentity);

    clearTelegramOidcTransaction(res);

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
        maxAge: 15 * 60,
      }),
    );

    res.redirect(env.FRONTEND_URL);
  } catch (error) {
    next(error);
  }
};
