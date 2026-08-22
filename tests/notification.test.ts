import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";
import type { UserPublicDto } from "@/dtos/auth.dto";

describe("Profile-scoped Notification Integration Tests (/api/v1/notifications)", () => {
  let customerToken: string;
  let customerId: string;
  let workerToken: string;
  let workerId: string;
  let customerProfileId: string;
  let workerProfileId: string;

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
      role: "CUSTOMER",
    });
    customerId = customer.id;
    customerToken = (await generateTokens(customer.id, "USER")).accessToken;
    const profile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerId },
    });
    customerProfileId = profile.id;

    const worker = await registerUser({
      name: "Notif Worker",
      telegramId: "tg_notif_worker",
      systemRole: "USER",
      role: "WORKER",
    });
    workerId = worker.id;
    workerToken = (await generateTokens(worker.id, "USER")).accessToken;
    const wProfile = await prisma.worker.findUniqueOrThrow({
      where: { userId: workerId },
    });
    workerProfileId = wProfile.id;
  });

  const createCustomerNotif = () =>
    prisma.notification.create({
      data: {
        customerProfileId,
        title: "Customer Notification",
        message: "You have a new proposal",
        type: "NEW_PROPOSAL",
      },
    });

  const createWorkerNotif = () =>
    prisma.notification.create({
      data: {
        workerId: workerProfileId,
        title: "Worker Notification",
        message: "Your proposal was accepted",
        type: "PROPOSAL_ACCEPTED",
      },
    });

  it("GET /notifications/customer should return empty list initially", async () => {
    const res = await request(app)
      .get("/api/v1/notifications/customer")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("scoped inboxes should require authentication", async () => {
    const res = await request(app).get("/api/v1/notifications/customer");
    expect(res.status).toBe(401);

    const res2 = await request(app).get("/api/v1/notifications/worker");
    expect(res2.status).toBe(401);
  });

  it("should reject wrong active role on scoped inboxes", async () => {
    const asWorker = await request(app)
      .get("/api/v1/notifications/customer")
      .set("Authorization", `Bearer ${workerToken}`);
    expect(asWorker.status).toBe(403);

    const asCustomer = await request(app)
      .get("/api/v1/notifications/worker")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(asCustomer.status).toBe(403);
  });

  it("GET /notifications/customer should list only customer notifications", async () => {
    await createCustomerNotif();

    const res = await request(app)
      .get("/api/v1/notifications/customer")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe("NEW_PROPOSAL");
  });

  it("should keep worker inbox isolated from customer notifications", async () => {
    await createCustomerNotif();

    const res = await request(app)
      .get("/api/v1/notifications/worker")
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("unread-count should be scoped per inbox", async () => {
    await createCustomerNotif();
    await createWorkerNotif();

    const customerRes = await request(app)
      .get("/api/v1/notifications/customer/unread-count")
      .set("Authorization", `Bearer ${customerToken}`);
    const workerRes = await request(app)
      .get("/api/v1/notifications/worker/unread-count")
      .set("Authorization", `Bearer ${workerToken}`);

    expect(customerRes.status).toBe(200);
    expect(customerRes.body.data.count).toBe(1);
    expect(workerRes.status).toBe(200);
    expect(workerRes.body.data.count).toBe(1);
  });

  it("PATCH /customer/:id/read should mark as read within own scope", async () => {
    const notif = await createCustomerNotif();

    const res = await request(app)
      .patch(`/api/v1/notifications/customer/${notif.id}/read`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.notification.findUnique({
      where: { id: notif.id },
    });
    expect(updated?.isRead).toBe(true);
  });

  it("PATCH :id/read should return 404 across scopes", async () => {
    const notif = await createWorkerNotif();

    const res = await request(app)
      .patch(`/api/v1/notifications/customer/${notif.id}/read`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
  });

  it("PATCH read-all should only clear the caller's scope", async () => {
    await createCustomerNotif();
    await createWorkerNotif();

    const res = await request(app)
      .patch("/api/v1/notifications/customer/read-all")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const unread = await prisma.notification.count({
      where: { workerId: workerProfileId, isRead: false },
    });
    expect(unread).toBe(1);
  });
});
