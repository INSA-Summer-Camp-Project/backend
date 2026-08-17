import type { NextFunction, Request, Response } from "express";

import type { PaginationDto } from "@/dtos/common.dto";
import * as jobService from "@/services/job.service";
import { sendSuccess } from "@/utils/response.util";

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const dto = req.body;
    const job = await jobService.createJob(userId, dto);
    sendSuccess(res, job, 201);
  } catch (error) {
    next(error);
  }
};

export const getCustomerJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobs = await jobService.getCustomerJobs(userId);
    sendSuccess(res, jobs);
  } catch (error) {
    next(error);
  }
};

export const getWorkerJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const jobs = await jobService.getWorkerJobs(userId);
    sendSuccess(res, jobs);
  } catch (error) {
    next(error);
  }
};

export const getPublicJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const pagination = req.query as unknown as PaginationDto;
    const categoryId = req.query.categoryId as string | undefined;

    const result = await jobService.getPublicJobs(pagination, categoryId);

    sendSuccess(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.id; // user might be undefined if not logged in
    const job = await jobService.getJobById(userId, id);
    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
};

export const updateJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const dto = req.body;
    const job = await jobService.updateJobStatus(userId, id, dto);
    sendSuccess(res, job);
  } catch (error) {
    next(error);
  }
};
