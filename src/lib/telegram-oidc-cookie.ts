import crypto from "node:crypto";

import { parseCookie, stringifySetCookie } from "cookie";
import type { Request, Response } from "express";

import { env } from "@/config/env";

const COOKIE_NAME = "telegram_oidc_transaction";
const COOKIE_MAX_AGE = 10 * 60; // 10 minutes

type TelegramOidcTransaction = {
  state: string;
  codeVerifier: string;
  nonce: string;
};

const isProduction = env.NODE_ENV === "production";

// Sign the value to prevent tampering
const sign = (value: string): string => {
  return crypto
    .createHmac("sha256", env.TELEGRAM_OIDC_COOKIE_SECRET)
    .update(value)
    .digest("base64url");
};

const encode = (transaction: TelegramOidcTransaction): string => {
  const payload = Buffer.from(JSON.stringify(transaction), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
};

const decode = (value: string): TelegramOidcTransaction | null => {
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex === -1) return null;

  const payload = value.slice(0, separatorIndex);
  const providedSignature = value.slice(separatorIndex + 1);
  const expectedSignature = sign(payload);

  const providedBuffer = Buffer.from(providedSignature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as TelegramOidcTransaction;

    if (
      typeof decoded.state !== "string" ||
      typeof decoded.codeVerifier !== "string" ||
      typeof decoded.nonce !== "string"
    ) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
};

export const setTelegramOidcTransaction = (
  res: Response,
  transaction: TelegramOidcTransaction,
): void => {
  res.append(
    "Set-Cookie",
    stringifySetCookie({
      name: COOKIE_NAME,
      value: encode(transaction),
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/api/auth/telegram",
      maxAge: COOKIE_MAX_AGE,
    }),
  );
};

export const getTelegramOidcTransaction = (
  req: Request,
): TelegramOidcTransaction | null => {
  const cookies = parseCookie(req.headers.cookie ?? "");
  const value = cookies[COOKIE_NAME];
  return value ? decode(value) : null;
};

export const clearTelegramOidcTransaction = (res: Response): void => {
  res.append(
    "Set-Cookie",
    stringifySetCookie({
      name: COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/api/auth/telegram",
      maxAge: 0,
    }),
  );
};
