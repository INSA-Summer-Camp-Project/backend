import { ActiveRole } from "@prisma/client";
import { z } from "zod";

export const completeOnboardingSchema = z.object({
  activeRole: z.enum([ActiveRole.CUSTOMER, ActiveRole.WORKER]),
  name: z.string().min(1, "Name is required").max(100).optional(),
  bio: z.string().max(1000).optional(),
  experience: z.string().max(500).optional(),
  categoryIds: z.array(z.string().uuid()).min(1).optional(),
});

export type CompleteOnboardingDto = z.infer<typeof completeOnboardingSchema>;

export const getOnboardingStatusSchema = z.object({});

export type GetOnboardingStatusDto = z.infer<typeof getOnboardingStatusSchema>;
