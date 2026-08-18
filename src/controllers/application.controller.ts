import type { NextFunction, Request, Response } from "express";

import type { CreateApplicationDto } from "@/dtos/application.dto";
import * as applicationService from "@/services/application.service";
import { sendSuccess } from "@/utils/response.util";

export const createApplication = async (
  req: Request<unknown, unknown, CreateApplicationDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workerId = req.user!.id;
    const dto = req.body;
    const application = await applicationService.createApplication(
      workerId,
      dto,
    );
    sendSuccess(res, application, 201);
  } catch (error) {
    next(error);
  }
};

export const getWorkerApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workerId = req.user!.id;
    const applications =
      await applicationService.getWorkerApplications(workerId);
    sendSuccess(res, applications);
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const workerId = req.user!.id;
    const { id } = req.params;
    const result = await applicationService.withdrawApplication(workerId, id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getJobApplications = async (
  req: Request<{ jobId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { jobId } = req.params;
    const applications = await applicationService.getJobApplications(
      customerId,
      jobId,
    );
    sendSuccess(res, applications);
  } catch (error) {
    next(error);
  }
};

export const rejectApplication = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const customerId = req.user!.id;
    const { id } = req.params;
    const result = await applicationService.rejectApplication(customerId, id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
