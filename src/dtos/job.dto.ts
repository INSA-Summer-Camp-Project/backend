import { JobStatus } from "@prisma/client";
import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  categoryId: z.uuid(),
  budget: z.coerce.number().positive(),
  targetWorkerId: z.uuid().optional(),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;

export const updateJobStatusSchema = z.object({
  status: z.enum(JobStatus),
});

export type UpdateJobStatusDto = z.infer<typeof updateJobStatusSchema>;
