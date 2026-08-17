import type { NextFunction, Request, Response } from "express";

import { paginationSchema } from "@/dtos/common.dto";
import * as workerService from "@/services/worker.service";
import { sendSuccess } from "@/utils/response.util";

export const getWorkers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const categoryId = req.query.categoryId as string | undefined;

    const result = await workerService.getWorkers(pagination, categoryId);

    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getWorkerById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const worker = await workerService.getWorkerById(id);
    sendSuccess(res, worker);
  } catch (error) {
    next(error);
  }
};
