import type { Request, Response } from "express";

import type { CreateApplicationDto } from "@/dtos/application.dto";
import * as applicationService from "@/services/application.service";
import { asyncHandler } from "@/utils/async-handler";
import { sendSuccess } from "@/utils/response.util";

export const createApplication = asyncHandler(
  async (
    req: Request<unknown, unknown, CreateApplicationDto>,
    res: Response,
  ) => {
    const workerId = req.user!.id;
    const dto = req.body;
    const application = await applicationService.createApplication(
      workerId,
      dto,
    );
    sendSuccess(res, application, 201);
  },
);

export const getWorkerApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const workerId = req.user!.id;
    const applications =
      await applicationService.getWorkerApplications(workerId);
    sendSuccess(res, applications);
  },
);

export const withdrawApplication = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const workerId = req.user!.id;
    const { id } = req.params;
    const result = await applicationService.withdrawApplication(workerId, id);
    sendSuccess(res, result);
  },
);

export const getJobApplications = asyncHandler(
  async (req: Request<{ jobId: string }>, res: Response) => {
    const customerId = req.user!.id;
    const { jobId } = req.params;
    const applications = await applicationService.getJobApplications(
      customerId,
      jobId,
    );
    sendSuccess(res, applications);
  },
);

export const rejectApplication = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const customerId = req.user!.id;
    const { id } = req.params;
    const result = await applicationService.rejectApplication(customerId, id);
    sendSuccess(res, result);
  },
);
