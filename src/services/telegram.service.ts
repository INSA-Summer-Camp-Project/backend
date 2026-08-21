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

export const verifyTelegramIdToken = async (
  idToken: string,
): Promise<TelegramIdentity> => {
  const config = await getTelegramConfiguration();

  // Allow implicit flow ID Token response
  oidc.useIdTokenResponseType(config);

  // We construct a fake redirect URL containing the ID token in the hash
  // This simulates the redirect that the browser would normally do, so openid-client can parse it
  const url = new URL(env.TELEGRAM_REDIRECT_URI);
  url.hash = `id_token=${idToken}`;

  // If the frontend passed a nonce to Telegram, it will be in the ID Token.
  // We extract it unverified first just to pass it to openid-client, which will then verify the signature.
  const parts = idToken.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }
  const payload = JSON.parse(
    Buffer.from(parts[1] as string, "base64").toString("utf-8"),
  );
  const nonce = payload.nonce ?? ""; // implicitAuthentication expects a string, so we pass empty string if no nonce

  let claims;
  try {
    claims = await oidc.implicitAuthentication(config, url, nonce as string);
  } catch (error) {
    throw new Error(
      `Telegram ID token validation failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
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
