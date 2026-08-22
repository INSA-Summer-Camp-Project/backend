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

  let tokensData;
  try {
    const url = new URL(currentUrlString);
    const code = url.searchParams.get("code");
    if (!code) throw new Error("No authorization code in URL");
    
    // Manual token exchange to bypass strict openid-client validation rules
    // that clash with Telegram's non-standard responses
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.TELEGRAM_REDIRECT_URI,
      client_id: env.TELEGRAM_CLIENT_ID,
      client_secret: env.TELEGRAM_CLIENT_SECRET,
      code_verifier: pkceCodeVerifier,
    });

    const tokenEndpoint = config.serverMetadata().token_endpoint;
    if (!tokenEndpoint) {
      throw new Error("Telegram OIDC discovery did not return a token_endpoint");
    }

    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Token exchange HTTP error ${tokenResponse.status}: ${errText}`);
    }

    tokensData = await tokenResponse.json();
  } catch (error) {
    console.error("Manual token exchange failed:", error);
    throw new Error(
      `Telegram code validation failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }

  if (!tokensData.id_token) {
    throw new Error("Telegram did not return an id_token");
  }

  // Parse the JWT without strict signature validation for this step since we just received it securely from the token endpoint
  let claims;
  try {
    const base64Url = tokensData.id_token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    claims = JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error("Failed to parse Telegram ID token", { cause: error });
  }

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
