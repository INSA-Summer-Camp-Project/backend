import * as oidc from "openid-client";
import { env } from "@/config/env";

const TELEGRAM_ISSUER = new URL("https://oauth.telegram.org");

let configurationPromise: Promise<oidc.Configuration> | undefined;

export const getTelegramConfiguration =
  async (): Promise<oidc.Configuration> => {
    configurationPromise ??= oidc
      .discovery(
        TELEGRAM_ISSUER,
        env.TELEGRAM_CLIENT_ID,
        env.TELEGRAM_CLIENT_SECRET,
        undefined,
        {
          timeout: 10,
        },
      )
      .catch((err) => {
        configurationPromise = undefined;
        throw err;
      });
    return await configurationPromise;
  };
