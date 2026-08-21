import type { Request, Response } from "express";
import * as applicationService from "@/services/application.service";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const applyToJob = asyncHandler(async (req: Request, res: Response) => {
  const applicationRecord = await applicationService.applyToJob(
    req.user!.id,
    String(req.params.jobId),
    req.body,
  );
  sendSuccess(res, applicationRecord, 201);
});

export const getJobApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const applications = await applicationService.getJobApplications(
      req.user!.id,
      String(req.params.jobId),
    );
    sendSuccess(res, applications);
  },
);

export const getMyApplications = asyncHandler(
  async (req: Request, res: Response) => {
    const applications = await applicationService.getMyApplications(
      req.user!.id,
    );
    sendSuccess(res, applications);
  },
);

export const acceptApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await applicationService.acceptApplication(
      req.user!.id,
      String(req.params.id),
    );
    sendSuccess(res, result);
  },
);

export const rejectApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationRecord = await applicationService.rejectApplication(
      req.user!.id,
      String(req.params.id),
    );
    sendSuccess(res, applicationRecord);
  },
);

export const withdrawApplication = asyncHandler(
  async (req: Request, res: Response) => {
    const applicationRecord = await applicationService.withdrawApplication(
      req.user!.id,
      String(req.params.id),
    );
    sendSuccess(res, applicationRecord);
  },
);
