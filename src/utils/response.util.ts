import type { Response } from "express";

import type { ApiResponse } from "@/types/api";

export const sendSuccess = <T, M = undefined>(
  res: Response<ApiResponse<T, M>>,
  data: T,
  statusCode: number = 200,
  meta?: M,
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta !== undefined && { meta }),
  } as unknown as ApiResponse<T, M>);
};
