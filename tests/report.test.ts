import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { registerUser } from "@/services/auth.service";
import * as reportService from "@/services/report.service";

describe("Report Feature Integration Tests", () => {
  beforeEach(async () => {
    await prisma.report.deleteMany();
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

  it("should create a report against another user", async () => {
    const reporter = await registerUser({
      name: "Reporter User",
      telegramId: "tg_reporter",
      role: "CUSTOMER",
    });

    const reported = await registerUser({
      name: "Reported Worker",
      telegramId: "tg_reported",
      role: "WORKER",
    });

    const report = await reportService.createReport(reporter.id, {
      reportedId: reported.id,
      reason: "SCAM",
      description: "This is a scam attempt report.",
    });

    expect(report).toBeDefined();
    expect(report.id).toBeDefined();
    expect(report.reporterId).toBe(reporter.id);
    expect(report.reportedId).toBe(reported.id);
    expect(report.reason).toBe("SCAM");
    expect(report.status).toBe("PENDING");
  });

  it("should not allow reporting a non-existent user", async () => {
    const reporter = await registerUser({
      name: "Reporter",
      telegramId: "tg_rep",
      role: "CUSTOMER",
    });

    await expect(
      reportService.createReport(reporter.id, {
        reportedId: "00000000-0000-0000-0000-000000000000",
        reason: "INAPPROPRIATE_BEHAVIOR",
        description: "Bad behavior",
      }),
    ).rejects.toThrow("Reported user not found");
  });

  it("should update a report status by admin", async () => {
    const reporter = await registerUser({
      name: "Reporter",
      telegramId: "tg_rep2",
      role: "CUSTOMER",
    });

    const reported = await registerUser({
      name: "Reported",
      telegramId: "tg_reported2",
      role: "WORKER",
    });

    const report = await reportService.createReport(reporter.id, {
      reportedId: reported.id,
      reason: "NO_SHOW",
      description: "Worker did not show up.",
    });

    const updated = await reportService.updateReportStatus(report.id, {
      status: "RESOLVED",
    });

    expect(updated.status).toBe("RESOLVED");
  });
});
