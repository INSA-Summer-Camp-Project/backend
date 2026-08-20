import type { Request, Response } from "express";

import type { PaginationDto } from "@/dtos/common.dto";
import * as jobService from "@/services/job.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const dto = req.body;
  const job = await jobService.createJob(userId, dto);
  sendSuccess(res, job, 201);
});

export const getCustomerJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const jobs = await jobService.getCustomerJobs(userId);
    sendSuccess(res, jobs);
  },
);

export const getWorkerJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const jobs = await jobService.getWorkerJobs(userId);
    sendSuccess(res, jobs);
  },
);

export const getPublicJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as PaginationDto & {
      categoryId?: string;
    };
    const categoryId = req.query.categoryId as string | undefined;

    const result = await jobService.getPublicJobs(query, categoryId);

    sendSuccess(res, result.data, 200, result.meta);
  },
);

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id; // user might be undefined if not logged in
  const job = await jobService.getJobById(userId, id);
  sendSuccess(res, job);
});

export const updateJobStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const dto = req.body;
    const job = await jobService.updateJobStatus(userId, id, dto);
    sendSuccess(res, job);
  },
);
