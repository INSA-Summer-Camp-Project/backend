import * as oidc from "openid-client";
import { env } from "@/config/env";

const TELEGRAM_ISSUER = new URL("https://oauth.telegram.org");

import axios from "axios";

let configurationPromise: Promise<oidc.Configuration> | undefined;

const axiosFetch = async (
  url: string | URL | Request,
  options?: any
): Promise<Response> => {
  const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url.url;
  const method = (options?.method || (url instanceof Request ? url.method : "GET")).toUpperCase();

  const res = await axios({
    url: urlStr,
    method,
    data: options?.body,
    headers: options?.headers,
    validateStatus: () => true, // openid-client handles its own status codes
    responseType: "arraybuffer",
    timeout: 10000,
  });

  return new Response(res.data, {
    status: res.status,
    statusText: res.statusText,
    headers: new Headers(res.headers as any),
  });
};

export const getTelegramConfiguration =
  async (): Promise<oidc.Configuration> => {
    if (!configurationPromise) {
      configurationPromise = oidc.discovery(
        TELEGRAM_ISSUER,
        env.TELEGRAM_CLIENT_ID,
        env.TELEGRAM_CLIENT_SECRET,
        undefined,
        {
          [oidc.customFetch]: axiosFetch,
          timeout: 10 // 10 seconds
        }
      ).catch((err) => {
        configurationPromise = undefined;
        throw err;
      });
    }
    return await configurationPromise;
  };
