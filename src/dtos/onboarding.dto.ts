import { ActiveRole } from "@prisma/client";
import { z } from "zod";

export const CompleteOnboardingDtoSchema = z.object({
  name: z.string().min(1).optional(),
  activeRole: z.nativeEnum(ActiveRole),
  bio: z.string().optional(),
  experience: z.string().optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export type CompleteOnboardingDto = z.infer<typeof CompleteOnboardingDtoSchema>;
