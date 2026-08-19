import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().uuid({ message: "Invalid job ID" }),
  rating: z
    .number({ message: "Rating is required" })
    .int({ message: "Rating must be an integer" })
    .min(1, { message: "Minimum rating is 1" })
    .max(5, { message: "Maximum rating is 5" }),
  comment: z
    .string()
    .trim()
    .max(1000, { message: "Comment cannot exceed 1000 characters" })
    .optional(),
});

export const updateReviewSchema = z.object({
  rating: z
    .number()
    .int({ message: "Rating must be an integer" })
    .min(1, { message: "Minimum rating is 1" })
    .max(5, { message: "Maximum rating is 5" })
    .optional(),
  comment: z
    .string()
    .trim()
    .max(1000, { message: "Comment cannot exceed 1000 characters" })
    .optional(),
});

export const workerReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;
export type WorkerReviewsQueryDto = z.infer<typeof workerReviewsQuerySchema>;
