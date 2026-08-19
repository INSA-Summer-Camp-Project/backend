import type { Request, Response, NextFunction } from "express";
import * as workerService from "@/services/worker.service";
import type { ApiResponse, PaginationMeta } from "@/types/api";
import type { WorkerQueryDto } from "@/dtos/worker.dto";
import { sendSuccess } from "@/utils/response.util";

/**
 * Controller handler for searching worker/provider profiles (SRS Section 4.7: GET /api/v1/search/providers).
 * Accepts validated query parameters (search keyword, categoryId, minRating, minRate, maxRate, sortBy, page, limit).
 */
export const searchProviders = async (
  req: Request,
  res: Response<ApiResponse<unknown, PaginationMeta>>,
  next: NextFunction,
): Promise<void> => {
  try {
    // Safely cast validated query params from validate middleware
    const query = req.query as unknown as WorkerQueryDto;
    // Delegate search logic to workerService with validated query params
    const result = await workerService.getWorkers(query);

    // Return standardized success response with payload and pagination metadata
    sendSuccess(res, result.workers, 200, result.meta);
  } catch (error) {
    // Pass async errors to global error middleware
    next(error);
  }
};
