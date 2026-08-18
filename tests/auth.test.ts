import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/services/auth.service";

describe("Auth Integration Tests", () => {
  beforeEach(async () => {
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

  it("should not create a Worker record when registering with role CUSTOMER", async () => {
    const customerUser = await registerUser({
      name: "Jane Customer",
      telegramId: "tg_654321",
      role: "CUSTOMER",
    });

    expect(customerUser).toBeDefined();
    expect(customerUser.worker).toBeNull();

    const workerInDb = await prisma.worker.findUnique({
      where: { userId: customerUser.id },
    });
    expect(workerInDb).toBeNull();
  });
});
