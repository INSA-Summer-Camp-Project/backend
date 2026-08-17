import { parseCookie } from "cookie";
import type { Request } from "express";

export const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length);
  }

  if (!token) {
    const cookies = parseCookie(req.headers.cookie ?? "");
    token = cookies.access_token;
  }

  return token;
};
