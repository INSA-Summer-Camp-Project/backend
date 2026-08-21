import type { Request, Response } from "express";
import * as authService from "@/services/auth.service";
import type { UpdateRoleDto } from "@/dtos/auth.dto";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";
import { env } from "@/config/env";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await authService.getCurrentUser(userId);
  sendSuccess(res, user);
});

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

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const isProduction = env.NODE_ENV === "production";
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
  sendSuccess(res, { message: "Logged out successfully" });
});
