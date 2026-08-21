import * as oidc from "openid-client";
import { env } from "@/config/env";
import { getTelegramConfiguration } from "@/lib/telegram-oidc";

export type TelegramIdentity = {
  sub: string;
  id?: number;
  name?: string;
  preferred_username?: string;
  picture?: string;
  phone_number?: string;
};

export const generateTelegramAuthUrl = async (): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
}> => {
  const config = await getTelegramConfiguration();

  const state = oidc.randomState();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

  const url = oidc.buildAuthorizationUrl(config, {
    client_id: env.TELEGRAM_CLIENT_ID,
    redirect_uri: env.TELEGRAM_REDIRECT_URI,
    response_type: "code",
    scope: "openid",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: url.href,
    state,
    codeVerifier,
  };
};

export const verifyTelegramCode = async (
  currentUrlString: string,
  expectedState: string,
  pkceCodeVerifier: string,
): Promise<TelegramIdentity> => {
  const config = await getTelegramConfiguration();

  let tokens;
  try {
    console.log("Calling oidc.authorizationCodeGrant...");
    const url = new URL(currentUrlString);
    tokens = await oidc.authorizationCodeGrant(
      config,
      url,
      {
        expectedState: expectedState,
        pkceCodeVerifier: pkceCodeVerifier,
      },
      {
        redirect_uri: env.TELEGRAM_REDIRECT_URI,
      },
    );
    console.log("Tokens received from Telegram OIDC");
  } catch (error) {
    console.error("oidc.authorizationCodeGrant failed:", error);
    throw new Error(
      `Telegram code validation failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  const claims = tokens.claims();

  if (!claims?.sub) {
    throw new Error("Telegram ID token is missing subject");
  }

  const identity: TelegramIdentity = {
    sub: claims.sub,
  };

  if (typeof claims.id === "number") {
    identity.id = claims.id;
  }
  if (typeof claims.name === "string") {
    identity.name = claims.name;
  }
  if (typeof claims.preferred_username === "string") {
    identity.preferred_username = claims.preferred_username;
  }
  if (typeof claims.picture === "string") {
    identity.picture = claims.picture;
  }
  if (typeof claims.phone_number === "string") {
    identity.phone_number = claims.phone_number;
  }

  return identity;
};
