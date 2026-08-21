import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { registerUser, generateTokens } from "@/services/auth.service";

describe("Notification Integration Tests (/api/v1/notifications)", () => {
  let customerToken: string;
  let customerId: string;

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

    const customer = await registerUser({
      name: "Notif Customer",
      telegramId: "tg_notif_customer",
      systemRole: "USER",
    });
    customerId = customer.id;
    customerToken = generateTokens(customer.id, "USER").accessToken;
  });

  it("GET /api/v1/notifications should return empty list initially", async () => {
    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("GET /api/v1/notifications should require authentication", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/notifications/unread-count should return 0 initially", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/unread-count")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.count).toBe(0);
  });

  it("PATCH /api/v1/notifications/:id/read should mark as read", async () => {
    const notif = await prisma.notification.create({
      data: {
        userId: customerId,
        title: "Test Notification",
        message: "You have a new message",
        type: "JOB_UPDATE",
      },
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${notif.id}/read`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.notification.findUnique({
      where: { id: notif.id },
    });
    expect(updated?.isRead).toBe(true);
  });

  it("PATCH /api/v1/notifications/read-all should mark all as read", async () => {
    await prisma.notification.createMany({
      data: [
        {
          userId: customerId,
          title: "Notif 1",
          message: "Message 1",
          type: "JOB_UPDATE",
        },
        {
          userId: customerId,
          title: "Notif 2",
          message: "Message 2",
          type: "PAYMENT",
        },
      ],
    });

    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const unread = await prisma.notification.count({
      where: { userId: customerId, isRead: false },
    });
    expect(unread).toBe(0);
  });
});
