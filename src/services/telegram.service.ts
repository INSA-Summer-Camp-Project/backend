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

export const createAuthorizationUrl = async (
  state: string,
  codeChallenge: string,
  nonce: string,
): Promise<URL> => {
  const config = await getTelegramConfiguration();

  return oidc.buildAuthorizationUrl(config, {
    redirect_uri: env.TELEGRAM_REDIRECT_URI,
    response_type: "code",
    scope: "openid profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
};

export const handleCallback = async (
  callbackUrl: URL,
  state: string,
  codeVerifier: string,
  nonce: string,
): Promise<TelegramIdentity> => {
  const config = await getTelegramConfiguration();

  const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState: state,
    expectedNonce: nonce,
    idTokenExpected: true,
  });

  const claims = tokens.claims();

  if (!claims) {
    throw new Error("Telegram did not return a valid ID token");
  }

  if (!claims.sub) {
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
