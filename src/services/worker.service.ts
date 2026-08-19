import { prisma } from "@/lib/prisma";
import { NotFoundError, ForbiddenError } from "@/middlewares/error.middleware";
import type {
  UpdateWorkerProfileDto,
  CreateWorkerServiceDto,
  UpdateWorkerServiceDto,
  CreatePortfolioDto,
  CreateCertificateDto,
} from "@/dtos/worker.dto";

const defaultUserSelect = {
  id: true,
  name: true,
  telegramId: true,
  email: true,
  phone: true,
};

const getWorkerOrThrow = async (userId: string) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
  });

  if (!worker) {
    throw new NotFoundError("Worker profile not found");
  }

  return worker;
};

// --- Worker Profile ---
export const getMyProfile = async (userId: string) => {
  const worker = await prisma.worker.findUnique({
    where: { userId },
    include: {
      services: {
        include: {
          category: true,
        },
      },
      portfolios: true,
      certificates: true,
      user: {
        select: defaultUserSelect,
      },
    },
  });

  if (!worker) {
    throw new NotFoundError("Worker profile not found");
  }

  return worker;
};

export const updateMyProfile = async (
  userId: string,
  data: UpdateWorkerProfileDto,
) => {
  const worker = await getWorkerOrThrow(userId);

  return prisma.worker.update({
    where: { id: worker.id },
    data: {
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.experienceYears !== undefined && {
        experienceYears: data.experienceYears,
      }),
      ...(data.profilePhoto !== undefined && {
        profilePhoto: data.profilePhoto,
      }),
      ...(data.paymentRate !== undefined && {
        paymentRate: data.paymentRate,
      }),
      ...(data.availability !== undefined && {
        availability: data.availability,
      }),
    },
    include: {
      services: {
        include: {
          category: true,
        },
      },
      portfolios: true,
      certificates: true,
      user: {
        select: defaultUserSelect,
      },
    },
  });
};

export const getPublicProfile = async (workerId: string) => {
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: {
      services: {
        include: {
          category: true,
        },
      },
      portfolios: true,
      certificates: true,
      user: {
        select: defaultUserSelect,
      },
    },
  });

  if (!worker) {
    throw new NotFoundError("Worker not found");
  }

  return worker;
};

// --- Services ---
export const getMyServices = async (userId: string) => {
  const worker = await getWorkerOrThrow(userId);

  return prisma.service.findMany({
    where: { providerId: worker.id },
    include: {
      category: true,
    },
  });
};

export const createService = async (
  userId: string,
  data: CreateWorkerServiceDto,
) => {
  const worker = await getWorkerOrThrow(userId);

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return prisma.service.create({
    data: {
      providerId: worker.id,
      categoryId: data.categoryId,
      name: data.name,
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
    },
    include: {
      category: true,
    },
  });
};

export const updateService = async (
  userId: string,
  serviceId: string,
  data: UpdateWorkerServiceDto,
) => {
  const worker = await getWorkerOrThrow(userId);

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new NotFoundError("Service not found");
  }

  if (service.providerId !== worker.id) {
    throw new ForbiddenError("Access denied: You do not own this service");
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new NotFoundError("Category not found");
    }
  }

  return prisma.service.update({
    where: { id: serviceId },
    data: {
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
    },
    include: {
      category: true,
    },
  });
};

export const deleteService = async (userId: string, serviceId: string) => {
  const worker = await getWorkerOrThrow(userId);

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    throw new NotFoundError("Service not found");
  }

  if (service.providerId !== worker.id) {
    throw new ForbiddenError("Access denied: You do not own this service");
  }

  await prisma.service.delete({
    where: { id: serviceId },
  });

  return { message: "Service deleted successfully" };
};

// --- Portfolios ---
export const createPortfolio = async (
  userId: string,
  data: CreatePortfolioDto,
) => {
  const worker = await getWorkerOrThrow(userId);

  return prisma.portfolio.create({
    data: {
      workerId: worker.id,
      title: data.title,
      imageUrl: data.imageUrl,
      ...(data.description !== undefined && { description: data.description }),
    },
  });
};

export const deletePortfolio = async (userId: string, portfolioId: string) => {
  const worker = await getWorkerOrThrow(userId);

  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
  });

  if (!portfolio) {
    throw new NotFoundError("Portfolio item not found");
  }

  if (portfolio.workerId !== worker.id) {
    throw new ForbiddenError(
      "Access denied: You do not own this portfolio item",
    );
  }

  await prisma.portfolio.delete({
    where: { id: portfolioId },
  });

  return { message: "Portfolio item deleted successfully" };
};

// --- Certificates ---
export const createCertificate = async (
  userId: string,
  data: CreateCertificateDto,
) => {
  const worker = await getWorkerOrThrow(userId);

  return prisma.certificate.create({
    data: {
      workerId: worker.id,
      title: data.title,
      fileUrl: data.fileUrl,
      issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
    },
  });
};

export const deleteCertificate = async (
  userId: string,
  certificateId: string,
) => {
  const worker = await getWorkerOrThrow(userId);

  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
  });

  if (!certificate) {
    throw new NotFoundError("Certificate not found");
  }

  if (certificate.workerId !== worker.id) {
    throw new ForbiddenError("Access denied: You do not own this certificate");
  }

  await prisma.certificate.delete({
    where: { id: certificateId },
  });

  return { message: "Certificate deleted successfully" };
};
