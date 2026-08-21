import type { Request, Response } from "express";
import * as authService from "@/services/auth.service";
import type { UpdateRoleDto, OnboardUserDto } from "@/dtos/auth.dto";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { env } from "@/config/env";
import { UnauthorizedError } from "@/middlewares/error.middleware";
import { parseCookie, stringifySetCookie } from "cookie";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getCurrentUser(userId);
  sendSuccess(res, user);
});

export const onboard = asyncHandler(
  async (req: Request<unknown, unknown, OnboardUserDto>, res: Response) => {
    const userId = req.user!.id;
    const user = await authService.onboardUser(userId, req.body);
    sendSuccess(res, user);
  },
);

export const updateRole = asyncHandler(
  async (req: Request<unknown, unknown, UpdateRoleDto>, res: Response) => {
    const userId = req.user!.id;
    const { activeRole } = req.body;
    const user = await authService.updateActiveRole(userId, activeRole);
    sendSuccess(res, user);
  },
);

export const adminOnlySample = asyncHandler(
  async (req: Request, res: Response) => {
    sendSuccess(res, {
      message: "Welcome Admin! Access granted.",
      user: req.user,
    });
  },
);

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const cookies = parseCookie(req.headers.cookie ?? "");
  const refreshToken = cookies.refresh_token;

  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token missing");
  }

  const tokens = await authService.verifyAndRotateRefreshToken(refreshToken);

  const isProduction = env.NODE_ENV === "production";

  res.append(
    "Set-Cookie",
    stringifySetCookie({
      name: "access_token",
      value: tokens.accessToken,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    }),
  );

  if (tokens.refreshToken) {
    res.append(
      "Set-Cookie",
      stringifySetCookie({
        name: "refresh_token",
        value: tokens.refreshToken,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      }),
    );
  }

  sendSuccess(res, { message: "Tokens refreshed successfully" });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const isProduction = env.NODE_ENV === "production";
  const cookies = parseCookie(req.headers.cookie ?? "");
  const refreshToken = cookies.refresh_token;

  if (refreshToken) {
    // We don't fail the logout if the token is already invalid/revoked
    try {
      await authService.revokeRefreshToken(refreshToken);
    } catch {
      // Ignore errors during revocation on logout
    }
  }

  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  sendSuccess(res, { message: "Logged out successfully" });
});
