import { PaymentStatus } from "@prisma/client";

import { chapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";
import { acceptAndAssignJob } from "@/services/application.service";

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
  const verification = await chapaClient.verifyPayment(txRef);
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
