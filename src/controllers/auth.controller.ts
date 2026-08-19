import type { Request, Response } from "express";

import { env } from "@/config/env";
import type { UpdateRoleDto } from "@/dtos/auth.dto";
import * as authService from "@/services/auth.service";
import type { ApiResponse } from "@/types/api";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getMe = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown>>) => {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);
    sendSuccess(res, user);
  },
);

export const updateRole = asyncHandler(
  async (
    req: Request<unknown, unknown, UpdateRoleDto>,
    res: Response<ApiResponse<unknown>>,
  ) => {
    const userId = req.user!.id;
    const { activeRole } = req.body;
    const user = await authService.updateActiveRole(userId, activeRole);
    sendSuccess(res, user);
  },
);

export const logout = asyncHandler(
  async (req: Request, res: Response<ApiResponse<unknown>>) => {
    const isProduction = env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });
    sendSuccess(res, { message: "Logged out successfully" });
  },
);
