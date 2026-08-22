import { ActiveRole } from "@prisma/client";
import { z } from "zod";

export const CompleteOnboardingDtoSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthdate: z.string().optional(),
  gender: z.string().optional(),
  activeRole: z.enum(ActiveRole),
  bio: z.string().optional(),
  experience: z.union([z.string(), z.number()]).optional(),
  categoryIds: z.array(z.uuid()).optional(),
});

export type CompleteOnboardingDto = z.infer<typeof CompleteOnboardingDtoSchema>;
