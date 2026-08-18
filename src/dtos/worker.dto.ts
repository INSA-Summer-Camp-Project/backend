import { z } from "zod";

/**
 * DTO Schema for searching and filtering worker profiles (Phase 3 Customer Search)
 */
export const WorkerQueryDtoSchema = z.object({
  /** Filter workers belonging to a specific service category UUID */
  categoryId: z.string().uuid("Invalid category ID format").optional(),

  /** Keyword search across worker bio, experience, and user name */
  search: z.string().min(1, "Search query must not be empty").optional(),

  /** Filter workers with average rating >= minRating (1.0 to 5.0) */
  minRating: z.coerce
    .number()
    .min(1, "Minimum rating must be at least 1.0")
    .max(5, "Minimum rating cannot exceed 5.0")
    .optional(),

  /** Filter workers with base rate >= minRate */
  minRate: z.coerce
    .number()
    .min(0, "Minimum rate cannot be negative")
    .optional(),

  /** Filter workers with base rate <= maxRate */
  maxRate: z.coerce
    .number()
    .min(0, "Maximum rate cannot be negative")
    .optional(),

  /** Sorting order: 'rating' (default), 'jobs', 'newest', 'rate_asc', 'rate_desc' */
  sortBy: z
    .enum(["rating", "jobs", "newest", "rate_asc", "rate_desc"])
    .default("rating"),

  /** Current page index (1-based, defaults to 1) */
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),

  /** Items per page limit (1 to 50, defaults to 20) */
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50, "Limit cannot exceed 50")
    .default(20),
});

export type WorkerQueryDto = z.infer<typeof WorkerQueryDtoSchema>;
