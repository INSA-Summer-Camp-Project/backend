import type { Request, Response, NextFunction } from "express";
import * as authService from "@/services/auth.service";
import type { ApiResponse } from "@/types/api";
import type { UpdateRoleDto } from "@/dtos/auth.dto";
import { sendSuccess } from "@/utils/response.util";
import { env } from "@/config/env";

export const getMe = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};
export const updateRole = async (
  req: Request<unknown, unknown, UpdateRoleDto>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { activeRole } = req.body;
    const user = await authService.updateActiveRole(userId, activeRole);
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

export const adminOnlySample = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    sendSuccess(res, {
      message: "Welcome Admin! Access granted.",
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const isProduction = env.NODE_ENV === "production";
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
    });
    sendSuccess(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
