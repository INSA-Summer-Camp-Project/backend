import type { Request, Response, NextFunction } from "express";
import * as workerService from "@/services/worker.service";
import { sendSuccess } from "@/utils/response.util";
import type {
  UpdateWorkerProfileDto,
  CreateWorkerServiceDto,
  UpdateWorkerServiceDto,
  CreatePortfolioDto,
  CreateCertificateDto,
} from "@/dtos/worker.dto";

// Profile
export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const worker = await workerService.getMyProfile(userId);
    sendSuccess(res, worker);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
  req: Request<unknown, unknown, UpdateWorkerProfileDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const worker = await workerService.updateMyProfile(userId, req.body);
    sendSuccess(res, worker);
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const worker = await workerService.getPublicProfile(req.params.id);
    sendSuccess(res, worker);
  } catch (error) {
    next(error);
  }
};

// Services
export const getMyServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const services = await workerService.getMyServices(userId);
    sendSuccess(res, services);
  } catch (error) {
    next(error);
  }
};

export const createService = async (
  req: Request<unknown, unknown, CreateWorkerServiceDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const service = await workerService.createService(userId, req.body);
    sendSuccess(res, service, 201);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (
  req: Request<{ serviceId: string }, unknown, UpdateWorkerServiceDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const service = await workerService.updateService(
      userId,
      req.params.serviceId,
      req.body,
    );
    sendSuccess(res, service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (
  req: Request<{ serviceId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await workerService.deleteService(
      userId,
      req.params.serviceId,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// Portfolios
export const createPortfolio = async (
  req: Request<unknown, unknown, CreatePortfolioDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const portfolio = await workerService.createPortfolio(userId, req.body);
    sendSuccess(res, portfolio, 201);
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (
  req: Request<{ portfolioId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await workerService.deletePortfolio(
      userId,
      req.params.portfolioId,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

// Certificates
export const createCertificate = async (
  req: Request<unknown, unknown, CreateCertificateDto>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const certificate = await workerService.createCertificate(userId, req.body);
    sendSuccess(res, certificate, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteCertificate = async (
  req: Request<{ certificateId: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await workerService.deleteCertificate(
      userId,
      req.params.certificateId,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
