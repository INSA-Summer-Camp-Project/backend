import type { Request, Response, NextFunction } from "express";
import * as workerService from "@/services/worker.service";
import type { ApiResponse, PaginationMeta } from "@/types/api";
import type { WorkerQueryDto } from "@/dtos/worker.dto";
import { sendSuccess } from "@/utils/response.util";

export const getWorkers = async (
  req: Request,
  res: Response<ApiResponse<unknown, PaginationMeta>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as unknown as WorkerQueryDto;
    const result = await workerService.getWorkers(query);
    sendSuccess(res, result.workers, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getWorkerById = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const worker = await workerService.getWorkerById(req.params.id);
    sendSuccess(res, worker);
  } catch (error) {
    next(error);
  }
};
