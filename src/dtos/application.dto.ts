import { z } from "zod";

export const createApplicationSchema = z.object({
  jobId: z.string().uuid("Invalid job ID format"),
  proposedPrice: z
    .number()
    .positive("Proposed price must be a positive number"),
  estimatedTime: z
    .number()
    .int("Estimated time must be an integer")
    .positive("Estimated time must be a positive number (in minutes)"),
});

export type CreateApplicationDto = z.infer<typeof createApplicationSchema>;
