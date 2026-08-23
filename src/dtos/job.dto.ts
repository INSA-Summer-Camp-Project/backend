import { z } from "zod";

/** Schema for creating a public marketplace job posting */
export const CreateJobDtoSchema = z.object({
  categoryId: z.string().uuid({ message: "Invalid category ID" }),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.number().positive("Budget must be a positive number"),
});

/** Schema for creating a direct-hire booking toward a specific worker */
export const CreateDirectJobDtoSchema = z.object({
  targetWorkerId: z.string().uuid({ message: "Invalid target worker ID" }),
  categoryId: z.string().uuid({ message: "Invalid category ID" }),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.number().positive("Budget must be a positive number"),
});

/** Query-string schema for the public job marketplace */
export const JobQueryDtoSchema = z.object({
  categoryId: z.string().uuid({ message: "Invalid category ID" }).optional(),
  minBudget: z.coerce.number().positive().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  q: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/** Partial update to an OPEN job posting */
export const UpdateJobDtoSchema = z.object({
  categoryId: z.string().uuid({ message: "Invalid category ID" }).optional(),
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .optional(),
  budget: z.number().positive("Budget must be a positive number").optional(),
});

/** Worker response to a DIRECT booking request */
export const DirectRespondDtoSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
});

/** Status transition patch (customer/assigned-worker) */
export const UpdateJobStatusDtoSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"]),
});

export type CreateJobDto = z.infer<typeof CreateJobDtoSchema>;
export type CreateDirectJobDto = z.infer<typeof CreateDirectJobDtoSchema>;
export type JobQueryDto = z.infer<typeof JobQueryDtoSchema>;
export type UpdateJobDto = z.infer<typeof UpdateJobDtoSchema>;
export type DirectRespondDto = z.infer<typeof DirectRespondDtoSchema>;
export type UpdateJobStatusDto = z.infer<typeof UpdateJobStatusDtoSchema>;
