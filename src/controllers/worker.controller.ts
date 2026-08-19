import type { Request, Response } from "express";

import { paginationSchema } from "@/dtos/common.dto";
import * as workerService from "@/services/worker.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const getWorkers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = paginationSchema.parse(req.query);
  const categoryId = req.query.categoryId as string | undefined;

  const result = await workerService.getWorkers(pagination, categoryId);

  sendSuccess(res, result.data, 200, result.meta);
});

export const getWorkerById = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const worker = await workerService.getWorkerById(id);
    sendSuccess(res, worker);
  },
);
