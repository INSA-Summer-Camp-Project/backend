import { z } from "zod";

/** Worker submits a bid / proposal on a marketplace job */
export const CreateApplicationDtoSchema = z.object({
  proposedPrice: z
    .number()
    .positive("Proposed price must be a positive number"),
  estimatedTime: z
    .string()
    .min(1, "Estimated time is required (e.g. '3 days')"),
});

export type CreateApplicationDto = z.infer<typeof CreateApplicationDtoSchema>;
