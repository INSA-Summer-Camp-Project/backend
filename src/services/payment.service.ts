import {
  ApplicationStatus,
  JobStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

import { env } from "@/config/env";
import { ChapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";
import { acceptAndAssignJob } from "@/services/application.service";

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
    throw new Error("Application not found");
  }

  if (application.job.customerId !== customerId) {
    throw new Error("Not authorized to pay for this application");
  }

  if (application.job.status !== JobStatus.OPEN) {
    throw new Error("Job is no longer open");
  }

  if (application.status !== ApplicationStatus.PENDING) {
    throw new Error("Application is not in a pending state");
  }

  const customer = await prisma.customerProfile.findUnique({
    where: { id: customerId },
    include: { user: true },
  });

  if (!customer) throw new Error("Customer not found");

  // 2. Generate txRef
  const txRef = `tx-${applicationId}-${Date.now()}`;

  // 3. Create Payment record
  const platformCommission = Number(application.proposedPrice) * 0.1; // 10% commission
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

  const chapaRes = await ChapaClient.initializeCheckout({
    amount: amountToPay,
    currency: "ETB",
    txRef,
    returnUrl,
    callbackUrl,
    customer: {
      email: customer.user.telegramId + "@servicehub.local", // Placeholder as discussed
      firstName: customer.user.name.split(" ")[0] || "Customer",
      lastName: customer.user.name.split(" ").slice(1).join(" ") || "Customer",
    },
  });

  return {
    checkoutUrl: chapaRes.data?.checkout_url,
    txRef,
  };
};

export const handleSuccessfulPayment = async (txRef: string) => {
  // 1. Find the pending payment
  const payment = await prisma.payment.findUnique({
    where: { txRef },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status === PaymentStatus.PAID) {
    return { success: true, message: "Payment already processed" };
  }

  // 2. Verify payment with Chapa
  const verification = await ChapaClient.verifyPayment(txRef);
  if (
    verification.status !== "success" ||
    verification.data?.status !== "success"
  ) {
    throw new Error("Payment verification failed at Chapa");
  }

  // 3. Database Transaction: Update Payment and orchestrate Domain Logic
  const result = await prisma.$transaction(async (tx) => {
    // Update payment
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.PAID },
    });

    // Delegate domain state transitions to Application Service
    const { acceptedApp, assignedJob } = await acceptAndAssignJob(
      tx,
      payment.applicationId,
    );

    return {
      payment: updatedPayment,
      application: acceptedApp,
      job: assignedJob,
    };
  });

  return result;
};
