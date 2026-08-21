import type { Request, Response } from "express";
import * as workerService from "@/services/worker.service";
import type {
  WorkerQueryDto,
  UpdateWorkerProfileDto,
  CreateWorkerServiceDto,
  CreatePortfolioDto,
  CreateCertificateDto,
} from "@/dtos/worker.dto";
import { sendSuccess } from "@/utils/response.util";
import { asyncHandler } from "@/utils/async-handler";

export const getWorkers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as WorkerQueryDto;
  const result = await workerService.getWorkers(query);
  sendSuccess(res, result.workers, 200, result.meta);
});

export const getWorkerById = asyncHandler(
  async (req: Request, res: Response) => {
    const worker = await workerService.getWorkerById(String(req.params.id));
    sendSuccess(res, worker);
  },
);

export const getMyProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const worker = await workerService.getMyProfile(userId);
    sendSuccess(res, worker);
  },
);

export const updateMyProfile = asyncHandler(
  async (
    req: Request<unknown, unknown, UpdateWorkerProfileDto>,
    res: Response,
  ) => {
    const userId = req.user!.id;
    const worker = await workerService.updateMyProfile(userId, req.body);
    sendSuccess(res, worker);
  },
);

export const getMyServices = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const services = await workerService.getMyServices(userId);
    sendSuccess(res, services);
  },
);

export const createService = asyncHandler(
  async (
    req: Request<unknown, unknown, CreateWorkerServiceDto>,
    res: Response,
  ) => {
    const userId = req.user!.id;
    const service = await workerService.createService(userId, req.body);
    sendSuccess(res, service, 201);
  },
);

export const updateService = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const service = await workerService.updateService(
      userId,
      String(req.params.serviceId),
      req.body,
    );
    sendSuccess(res, service);
  },
);

export const deleteService = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await workerService.deleteService(
      userId,
      String(req.params.serviceId),
    );
    sendSuccess(res, result);
  },
);

export const createPortfolio = asyncHandler(
  async (req: Request<unknown, unknown, CreatePortfolioDto>, res: Response) => {
    const userId = req.user!.id;
    const portfolio = await workerService.createPortfolio(userId, req.body);
    sendSuccess(res, portfolio, 201);
  },
);

export const deletePortfolio = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await workerService.deletePortfolio(
      userId,
      String(req.params.portfolioId),
    );
    sendSuccess(res, result);
  },
);

export const createCertificate = asyncHandler(
  async (
    req: Request<unknown, unknown, CreateCertificateDto>,
    res: Response,
  ) => {
    const userId = req.user!.id;
    const certificate = await workerService.createCertificate(userId, req.body);
    sendSuccess(res, certificate, 201);
  },
);

export const deleteCertificate = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await workerService.deleteCertificate(
      userId,
      String(req.params.certificateId),
    );
    sendSuccess(res, result);
  },
);
