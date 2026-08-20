import { PaymentStatus } from "@prisma/client";

import { NotFoundError, BadRequestError } from "@/errors";
import { chapaClient } from "@/lib/chapa/chapa.client";
import { prisma } from "@/lib/prisma";

export const handleSuccessfulPayment = async (txRef: string) => {
  const payment = await prisma.payment.findUnique({
    where: { txRef },
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

  return { payment: updatedPayment };
};
