import { z } from "zod";

import { paginationSchema } from "@/dtos/common.dto";

export const CreateReviewDtoSchema = z.object({
  jobId: z.uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).min(1),
});

export type CreateReviewDto = z.infer<typeof CreateReviewDtoSchema>;

export const ReviewQueryDtoSchema = paginationSchema.extend({
  workerId: z.uuid().optional(),
  jobId: z.uuid().optional(),
  customerId: z.uuid().optional(),
});

export type ReviewQueryDto = z.infer<typeof ReviewQueryDtoSchema>;
