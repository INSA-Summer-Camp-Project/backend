import {
  ApplicationStatus,
  JobStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

import { env } from "@/config/env";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@/middlewares/error.middleware";
import { chapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";

const PLATFORM_COMMISSION_RATE = 0.1;

export const createCheckout = async (userId: string, applicationId: string) => {
  const customer = await prisma.customerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });

  if (!customer) {
    throw new ForbiddenError("Customer profile not found for this user");
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  if (application.job.customerId !== customer.id) {
    throw new ForbiddenError("Not authorized to pay for this application");
  }

  if (
    application.job.status !== JobStatus.OPEN &&
    application.job.status !== JobStatus.PENDING &&
    application.job.status !== JobStatus.IN_PROGRESS
  ) {
    throw new BadRequestError("Job is no longer available for payment");
  }

  if (application.status !== ApplicationStatus.ACCEPTED) {
    throw new BadRequestError("Application is not in an accepted state");
  }

  const shortId = applicationId.replace(/-/g, "").slice(0, 8);
  const shortTs = Date.now().toString().slice(-6);
  const txRef = `sh_${shortId}_${shortTs}`;

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

  const returnUrl =
    env.CHAPA_RETURN_URL ||
    `${env.FRONTEND_URL}/customer/checkout/${application.jobId}/success`;
  const callbackUrl =
    env.CHAPA_CALLBACK_URL ||
    `${env.BACKEND_PUBLIC_URL}/api/v1/payments/webhook`;

  const chapaRes = await chapaClient.initializeCheckout({
    amount: amountToPay,
    currency: "ETB",
    txRef,
    returnUrl,
    callbackUrl,
    customer: {
      email: `user${Date.now()}@servicehub.io`,
      firstName: customer.user.name.split(" ")[0] || "Customer",
      lastName: customer.user.name.split(" ").slice(1).join(" ") || "Customer",
    },
  });

  return {
    checkoutUrl: chapaRes.data?.checkout_url,
    txRef,
  };
};

export const verifyPayment = async (txRef: string, userId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { txRef },
    include: {
      application: {
        include: { job: true },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Authorize: Only the customer who owns the job can verify
  const customer = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customer || payment.application.job.customerId !== customer.id) {
    throw new ForbiddenError("Not authorized to view this payment");
  }

  // Check with Chapa
  try {
    const chapaRes = await chapaClient.verifyPayment(txRef);

    if (chapaRes.data?.status === "success" && payment.status !== PaymentStatus.PAID) {
      await prisma.payment.update({
        where: { txRef },
        data: { status: PaymentStatus.PAID },
      });
      return PaymentStatus.PAID;
    } else if (chapaRes.data?.status === "failed" && payment.status !== PaymentStatus.FAILED) {
      await prisma.payment.update({
        where: { txRef },
        data: { status: PaymentStatus.FAILED },
      });
      return PaymentStatus.FAILED;
    }
  } catch (err) {
    // If chapa verification fails (e.g. network error), we return the current DB status
    console.error("Error verifying payment with Chapa:", err);
  }

  return payment.status;
};
