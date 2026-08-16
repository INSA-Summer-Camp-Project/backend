import * as oidc from "openid-client";
import { env } from "@/config/env";

const TELEGRAM_ISSUER = new URL("https://oauth.telegram.org");

let configurationPromise: Promise<oidc.Configuration> | undefined;

export const getTelegramConfiguration =
  async (): Promise<oidc.Configuration> => {
    if (!configurationPromise) {
      configurationPromise = oidc.discovery(
        TELEGRAM_ISSUER,
        env.TELEGRAM_CLIENT_ID,
        env.TELEGRAM_CLIENT_SECRET,
      );
    }
    return configurationPromise;
  };

export const generateTelegramPkce = async () => {
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  return { codeVerifier, codeChallenge };
};

export const generateTelegramState = () => {
  return oidc.randomState();
};

export const generateTelegramNonce = () => {
  return oidc.randomNonce();
};
