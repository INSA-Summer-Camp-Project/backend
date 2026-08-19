import type { Request, Response, NextFunction } from "express";
import * as jobService from "@/services/job.service";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// POST /api/v1/jobs  — create marketplace posting
// ---------------------------------------------------------------------------
export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobService.createJob(req.user!.id, req.body);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/jobs/direct  — create direct-hire booking
// ---------------------------------------------------------------------------
export const createDirectJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobService.createDirectJob(req.user!.id, req.body);
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/jobs  — public marketplace listing
// ---------------------------------------------------------------------------
export const getPublicJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await jobService.getPublicJobs(req.query as never);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/jobs/my  — job list scoped to the authenticated user's role
// ---------------------------------------------------------------------------
export const getMyJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { lastActiveRole: true },
    });
    const jobs = await jobService.getMyJobs(
      req.user!.id,
      user?.lastActiveRole ?? null,
    );
    res.status(200).json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/jobs/:id  — full job detail
// ---------------------------------------------------------------------------
export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobService.getJobById(
      String(req.params.id),
      req.user?.id ?? undefined,
    );
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/v1/jobs/:id  — update open job listing
// ---------------------------------------------------------------------------
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobService.updateJob(
      req.user!.id,
      String(req.params.id),
      req.body,
    );
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/jobs/:id/direct-respond  — worker responds to direct booking
// ---------------------------------------------------------------------------
export const directRespond = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobService.respondToDirectJob(
      req.user!.id,
      String(req.params.id),
      req.body,
    );
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/jobs/:id/status  — transition job status
// ---------------------------------------------------------------------------
export const updateJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const job = await jobService.updateJobStatus(
      req.user!.id,
      String(req.params.id),
      req.body,
    );
    res.status(200).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
};
