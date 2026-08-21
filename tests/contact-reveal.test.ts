import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "@/app";
import { prisma } from "@/lib/prisma";
import { generateTokenPair as generateTokens } from "@/services/auth.service";
import { registerTestUser as registerUser } from "./auth.helper";
import type { UserPublicDto } from "@/dtos/auth.dto";
import type { Category } from "@prisma/client";

describe("Contact Reveal Tests (/api/v1/jobs/:id/contact)", () => {
  let customerUser: UserPublicDto;
  let customerToken: string;
  let workerUser: UserPublicDto;
  let workerToken: string;
  let thirdPartyUser: UserPublicDto;
  let thirdPartyToken: string;
  let category: Category;

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

    customerUser = await registerUser({
      name: "Customer Alice",
      telegramId: "tg_alice_contact",
      systemRole: "USER",
    });
    await prisma.user.update({
      where: { id: customerUser.id },
      data: { phone: "+251911223344", lastActiveRole: "CUSTOMER" },
    });
    customerToken = (await generateTokens(customerUser.id, "USER")).accessToken;

    workerUser = await registerUser({
      name: "Worker Bob",
      telegramId: "tg_bob_contact",
      systemRole: "USER",
      role: "WORKER",
    });
    await prisma.user.update({
      where: { id: workerUser.id },
      data: { phone: "+251922334455", lastActiveRole: "WORKER" },
    });
    workerToken = (await generateTokens(workerUser.id, "USER")).accessToken;

    thirdPartyUser = await registerUser({
      name: "Third Party Charlie",
      telegramId: "tg_charlie_contact",
      systemRole: "USER",
    });
    thirdPartyToken = (await generateTokens(thirdPartyUser.id, "USER"))
      .accessToken;

    category = await prisma.category.create({
      data: { name: "Plumbing Contact Test" },
    });
  });

  it("should return 400 if job is still OPEN with no assigned worker", async () => {
    const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUser.id },
    });

    const job = await prisma.job.create({
      data: {
        customerId: customerProfile.id,
        categoryId: category.id,
        title: "Fix Leak",
        description: "Kitchen leak",
        budget: 500,
        status: "OPEN",
      },
    });

    const res = await request(app)
      .get(`/api/v1/jobs/${job.id}/contact`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 403 for third-party user attempting to access contact info", async () => {
    const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUser.id },
    });
    const workerProfile = await prisma.worker.findUniqueOrThrow({
      where: { userId: workerUser.id },
    });

    const job = await prisma.job.create({
      data: {
        customerId: customerProfile.id,
        assignedWorkerId: workerProfile.id,
        categoryId: category.id,
        title: "Fix Leak",
        description: "Kitchen leak",
        budget: 500,
        status: "IN_PROGRESS",
      },
    });

    const res = await request(app)
      .get(`/api/v1/jobs/${job.id}/contact`)
      .set("Authorization", `Bearer ${thirdPartyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should allow customer to reveal worker's contact info when assigned", async () => {
    const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUser.id },
    });
    const workerProfile = await prisma.worker.findUniqueOrThrow({
      where: { userId: workerUser.id },
    });

    const job = await prisma.job.create({
      data: {
        customerId: customerProfile.id,
        assignedWorkerId: workerProfile.id,
        categoryId: category.id,
        title: "Fix Leak",
        description: "Kitchen leak",
        budget: 500,
        status: "IN_PROGRESS",
      },
    });

    const res = await request(app)
      .get(`/api/v1/jobs/${job.id}/contact`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counterpartRole).toBe("WORKER");
    expect(res.body.data.contact.name).toBe("Worker Bob");
    expect(res.body.data.contact.phone).toBe("+251922334455");
    expect(res.body.data.contact.telegramId).toBe("tg_bob_contact");
  });

  it("should allow worker to reveal customer's contact info when assigned", async () => {
    const customerProfile = await prisma.customerProfile.findUniqueOrThrow({
      where: { userId: customerUser.id },
    });
    const workerProfile = await prisma.worker.findUniqueOrThrow({
      where: { userId: workerUser.id },
    });

    const job = await prisma.job.create({
      data: {
        customerId: customerProfile.id,
        assignedWorkerId: workerProfile.id,
        categoryId: category.id,
        title: "Fix Leak",
        description: "Kitchen leak",
        budget: 500,
        status: "IN_PROGRESS",
      },
    });

    const res = await request(app)
      .get(`/api/v1/jobs/${job.id}/contact`)
      .set("Authorization", `Bearer ${workerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counterpartRole).toBe("CUSTOMER");
    expect(res.body.data.contact.name).toBe("Customer Alice");
    expect(res.body.data.contact.phone).toBe("+251911223344");
    expect(res.body.data.contact.telegramId).toBe("tg_alice_contact");
  });
});
