import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerTestUser as registerUser } from "./auth.helper";

describe("Auth Integration Tests", () => {
  beforeEach(async () => {
    await prisma.review.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.certificate.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.service.deleteMany();
    await prisma.category.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.customerProfile.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should automatically create a Worker record when registering with role WORKER", async () => {
    const workerUser = await registerUser({
      name: "John Worker",
      telegramId: "tg_123456",
      role: "WORKER",
    });

    expect(workerUser).toBeDefined();
    expect(workerUser.worker).toBeDefined();
    expect(workerUser.worker?.experienceYears).toBe(0);

    const workerInDb = await prisma.worker.findUnique({
      where: { userId: workerUser.id },
    });
    expect(workerInDb).toBeDefined();
    expect(workerInDb?.userId).toBe(workerUser.id);
  });
});
