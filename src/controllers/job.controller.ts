import type { Request, Response } from "express";
import * as jobService from "@/services/job.service";
import { prisma } from "@/lib/prisma";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.createJob(req.user!.id, req.body);
  sendSuccess(res, job, 201);
});

export const createDirectJob = asyncHandler(
  async (req: Request, res: Response) => {
    const job = await jobService.createDirectJob(req.user!.id, req.body);
    sendSuccess(res, job, 201);
  },
);

export const getPublicJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await jobService.getPublicJobs(req.query as never);
    sendSuccess(res, result.jobs, 200, result.meta);
  },
);

export const getMyJobs = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { lastActiveRole: true },
  });
  const jobs = await jobService.getMyJobs(
    req.user!.id,
    user?.lastActiveRole ?? null,
  );
  sendSuccess(res, jobs);
});

export const getJobById = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.getJobById(
    String(req.params.id),
    req.user?.id ?? undefined,
  );
  sendSuccess(res, job);
});

export const updateJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.updateJob(
    req.user!.id,
    String(req.params.id),
    req.body,
  );
  sendSuccess(res, job);
});

export const directRespond = asyncHandler(
  async (req: Request, res: Response) => {
    const job = await jobService.respondToDirectJob(
      req.user!.id,
      String(req.params.id),
      req.body,
    );
    sendSuccess(res, job);
  },
);

export const updateJobStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const job = await jobService.updateJobStatus(
      req.user!.id,
      String(req.params.id),
      req.body,
    );
    sendSuccess(res, job);
  },
);

export const getJobContact = asyncHandler(
  async (req: Request, res: Response) => {
    const contact = await jobService.getJobContact(
      String(req.params.id),
      req.user!.id,
    );
    sendSuccess(res, contact);
  },
);
