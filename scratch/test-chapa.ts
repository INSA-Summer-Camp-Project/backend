import crypto, { randomUUID } from "node:crypto";

import { ApplicationStatus, JobStatus, SystemRole } from "@prisma/client";

import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { createCheckout } from "@/services/payment.service";
import { handleSuccessfulPayment } from "@/services/payment-webhook.service";

console.log("🚀 Starting Chapa Payment Verification Test...");

// 1. Create a dummy user, customer profile, and job
const testId = randomUUID().substring(0, 8);
console.log(`\n📦 Creating Mock Data (Test ID: ${testId})...`);

const user = await prisma.user.create({
  data: {
    telegramId: `test-${testId}`,
    name: `Test User ${testId}`,
    systemRole: SystemRole.USER,
    lastActiveRole: "CUSTOMER",
    customerProfile: {
      create: {
        bio: "Test bio",
      },
    },
  },
  include: { customerProfile: true },
});

const customerId = user.customerProfile!.id;

const category =
  (await prisma.serviceCategory.findFirst()) ||
  (await prisma.serviceCategory.create({
    data: { name: `Test Category ${testId}` },
  }));

const job = await prisma.job.create({
  data: {
    customerId,
    categoryId: category.id,
    title: "Test Job for Chapa",
    description: "Testing Chapa Integration",
    budget: 1500,
    source: "MARKETPLACE",
    status: JobStatus.OPEN,
  },
});

const workerUser = await prisma.user.create({
  data: {
    telegramId: `worker-${testId}`,
    name: `Test Worker ${testId}`,
    systemRole: SystemRole.USER,
    lastActiveRole: "WORKER",
    workerProfile: {
      create: {
        bio: "Test Bio",
        experience: "1 year",
      },
    },
  },
  include: { workerProfile: true },
});

const application = await prisma.application.create({
  data: {
    jobId: job.id,
    workerId: workerUser.workerProfile!.id,
    proposedPrice: 1500.0,
    estimatedTime: 5,
    status: ApplicationStatus.PENDING,
  },
});

console.log("✅ Mock Data Created:");
console.log(`   Customer ID: ${customerId}`);
console.log(`   Job ID: ${job.id}`);
console.log(`   Application ID: ${application.id}`);

// 2. Initialize Payment
console.log("\n💳 Calling createCheckout() to Initialize Chapa Payment...");
try {
  const checkoutResult = await createCheckout(customerId, application.id);
  console.log("✅ Chapa Initialized Successfully!");
  console.log(`   Checkout URL: ${checkoutResult.checkoutUrl}`);
  console.log(`   Transaction Ref: ${checkoutResult.txRef}`);

  // 3. Simulate Webhook
  console.log("\n🔗 Simulating Webhook Callback...");

  // Create the mock payload Chapa would send
  const mockPayload = {
    event: "charge.success",
    first_name: "Test",
    last_name: "User",
    amount: "1500",
    currency: "ETB",
    tx_ref: checkoutResult.txRef,
    reference: `ref-${testId}`,
    status: "success",
  };

  const payloadString = JSON.stringify(mockPayload);
  const signature = crypto
    .createHmac("sha256", env.CHAPA_ENCRYPTION_KEY)
    .update(payloadString)
    .digest("hex");

  console.log("   Generated Mock Signature:", signature);

  // Call the internal webhook handler manually
  await handleSuccessfulPayment(checkoutResult.txRef);

  console.log("✅ Webhook Handled Successfully!");

  // 4. Verify Final State in DB
  console.log("\n🔍 Verifying Database State...");
  const updatedJob = await prisma.job.findUnique({ where: { id: job.id } });
  const updatedApp = await prisma.application.findUnique({
    where: { id: application.id },
  });
  const payment = await prisma.payment.findUnique({
    where: { txRef: checkoutResult.txRef },
  });

  console.log(`   Job Status: ${updatedJob?.status} (Expected: IN_PROGRESS)`);
  console.log(`   App Status: ${updatedApp?.status} (Expected: ACCEPTED)`);
  console.log(`   Payment Status: ${payment?.status} (Expected: COMPLETED)`);
} catch (error) {
  console.error("❌ Test Failed:", error);
} finally {
  console.log("\n🧹 Cleaning up database...");
  await prisma.payment.deleteMany({ where: { jobId: job.id } });
  await prisma.application.delete({ where: { id: application.id } });
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.user.delete({ where: { id: workerUser.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log("✅ Cleanup Complete.");
}
