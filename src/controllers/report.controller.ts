import type { Request, Response } from "express";
import * as reportService from "@/services/report.service";
import type { CreateReportDto, UpdateReportStatusDto } from "@/dtos/report.dto";
import type { ReportStatus } from "@prisma/client";
import { asyncHandler } from "@/utils/async-handler";

export const submitReport = asyncHandler(
  async (req: Request, res: Response) => {
    const reporterId = req.user!.id;
    const data = req.body as CreateReportDto;

    const report = await reportService.createReport(reporterId, data);

    res.status(201).json({
      success: true,
      data: report,
    });
  },
);

export const getMyReports = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const reports = await reportService.getReportsByUser(userId);

    res.status(200).json({
      success: true,
      data: reports,
    });
  },
);

export const getAllReports = asyncHandler(
  async (req: Request, res: Response) => {
    const status = req.query.status as ReportStatus | undefined;
    const query: { status?: ReportStatus } = {};
    if (status) query.status = status;
    const reports = await reportService.getAllReports(query);

    res.status(200).json({
      success: true,
      data: reports,
    });
  },
);

export const updateReportStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const reportId = req.params.id as string;
    const data = req.body as UpdateReportStatusDto;

    const report = await reportService.updateReportStatus(reportId, data);

    res.status(200).json({
      success: true,
      data: report,
    });
  },
);
