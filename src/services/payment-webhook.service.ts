import { PaymentStatus } from "@prisma/client";

import { BadRequestError, NotFoundError } from "@/middlewares/error.middleware";
import { chapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/services/notification.service";

export const handleSuccessfulPayment = async (txRef: string) => {
  const payment = await prisma.payment.findUnique({
    where: { txRef },
    include: {
      job: {
        include: {
          customer: { select: { userId: true } },
          assignedWorker: { select: { userId: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  if (payment.status === PaymentStatus.PAID) {
    return { success: true, message: "Payment already processed" };
  }

  const verification = await chapaClient.verifyPayment(txRef);
  if (
    verification.status !== "success" ||
    verification.data?.status !== "success"
  ) {
    throw new BadRequestError("Payment verification failed at Chapa");
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.PAID },
  });

  // Trigger notifications
  if (payment.job) {
    await createNotification(
      payment.job.customer.userId,
      "Payment Successful",
      `Your payment of ${payment.amount} ETB for "${payment.job.title}" has been confirmed.`,
      "PAYMENT_SUCCESS",
      `/customer/jobs/${payment.job.id}`,
    ).catch(() => {});

    if (payment.job.assignedWorker) {
      await createNotification(
        payment.job.assignedWorker.userId,
        "Payment Secured in Escrow",
        `Payment of ${payment.amount} ETB for "${payment.job.title}" is now held in escrow.`,
        "PAYMENT_SUCCESS",
        `/worker/jobs/${payment.job.id}`,
      ).catch(() => {});
    }
  }

  return { payment: updatedPayment };
};
