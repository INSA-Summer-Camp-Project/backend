import type { Request, Response } from "express";
import * as workerService from "@/services/worker.service";
import type { WorkerQueryDto } from "@/dtos/worker.dto";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const searchProviders = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as WorkerQueryDto;
    const result = await workerService.getWorkers(query);
    sendSuccess(res, result.workers, 200, result.meta);
  },
);
