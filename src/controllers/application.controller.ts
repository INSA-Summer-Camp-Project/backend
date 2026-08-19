import type { Request, Response, NextFunction } from "express";
import * as applicationService from "@/services/application.service";

// ---------------------------------------------------------------------------
// POST /api/v1/jobs/:jobId/apply  — worker submits a bid
// ---------------------------------------------------------------------------
export const applyToJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applicationRecord = await applicationService.applyToJob(
      req.user!.id,
      String(req.params.jobId),
      req.body,
    );
    res.status(201).json({ success: true, data: applicationRecord });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/jobs/:jobId/applications  — customer views bids on their job
// ---------------------------------------------------------------------------
export const getJobApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applications = await applicationService.getJobApplications(
      req.user!.id,
      String(req.params.jobId),
    );
    res.status(200).json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/applications/me  — worker views their own bids
// ---------------------------------------------------------------------------
export const getMyApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applications = await applicationService.getMyApplications(
      req.user!.id,
    );
    res.status(200).json({ success: true, data: applications });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/applications/:id/accept  — customer accepts a winning bid
// ---------------------------------------------------------------------------
export const acceptApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await applicationService.acceptApplication(
      req.user!.id,
      String(req.params.id),
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/applications/:id/reject  — customer rejects a bid
// ---------------------------------------------------------------------------
export const rejectApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applicationRecord = await applicationService.rejectApplication(
      req.user!.id,
      String(req.params.id),
    );
    res.status(200).json({ success: true, data: applicationRecord });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/applications/:id  — worker withdraws their bid
// ---------------------------------------------------------------------------
export const withdrawApplication = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const applicationRecord = await applicationService.withdrawApplication(
      req.user!.id,
      String(req.params.id),
    );
    res.status(200).json({ success: true, data: applicationRecord });
  } catch (err) {
    next(err);
  }
};
