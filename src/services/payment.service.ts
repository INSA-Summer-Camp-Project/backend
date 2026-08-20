import {
  ApplicationStatus,
  JobStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

import { env } from "@/config/env";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/errors";
import { chapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";

const PLATFORM_COMMISSION_RATE = 0.1; // 10% commission

export const createCheckout = async (
  customerId: string,
  applicationId: string,
) => {
  // 1. Verify the application and job
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
    },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.job.customerId !== customerId) {
    throw new ForbiddenError("Not authorized to pay for this application");
  }

  if (
    application.job.status !== JobStatus.OPEN &&
    application.job.status !== JobStatus.ASSIGNED
  ) {
    throw new BadRequestError("Job is no longer open");
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new BadRequestError("Application is not in a pending state");
  }

  const customer = await prisma.customerProfile.findUnique({
    where: { id: customerId },
    include: { user: true },
  });

  if (!customer) throw new NotFoundError("Customer not found");

  // 2. Generate txRef (max 50 chars per Chapa API)
  const shortId = applicationId.replace(/-/g, "").slice(0, 8);
  const shortTs = Date.now().toString().slice(-6);
  const txRef = `sh_${shortId}_${shortTs}`;

  // 3. Create Payment record
  const platformCommission =
    Number(application.proposedPrice) * PLATFORM_COMMISSION_RATE;
  const amountToPay = Number(application.proposedPrice);

  await prisma.payment.create({
    data: {
      jobId: application.jobId,
      applicationId: application.id,
      amount: amountToPay,
      currency: "ETB",
      method: PaymentMethod.CHAPA,
      status: PaymentStatus.PENDING,
      txRef,
      platformCommission,
    },
  });

  // 4. Initialize with Chapa Client
  const returnUrl =
    env.CHAPA_RETURN_URL ||
    `${env.FRONTEND_URL}/customer/jobs/${application.jobId}?payment=success`;
  const callbackUrl =
    env.CHAPA_CALLBACK_URL ||
    `${env.FRONTEND_URL.replace("localhost", "host.docker.internal")}/api/payments/webhook`;

  const chapaRes = await chapaClient.initializeCheckout({
    amount: amountToPay,
    currency: "ETB",
    txRef,
    returnUrl,
    callbackUrl,
    customer: {
      email: `user${Date.now()}@servicehub.io`, // Placeholder as discussed
      firstName: customer.user.name.split(" ")[0] || "Customer",
      lastName: customer.user.name.split(" ").slice(1).join(" ") || "Customer",
    },
  });

  return {
    checkoutUrl: chapaRes.data?.checkout_url,
    txRef,
  };
};
