import type { Request, Response, NextFunction } from "express";
import * as authService from "@/services/auth.service";
import type { ApiResponse } from "@/types/api";

export const register = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await authService.refreshAccessToken(req.body.refreshToken);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const user = await authService.getCurrentUser(userId);
    res.status(200).json({
      success: true,
      data: user,
    });
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
    res.status(200).json({
      success: true,
      data: {
        message: "Welcome Admin! Access granted.",
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};
