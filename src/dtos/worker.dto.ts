import { z } from "zod";

/**
 * DTO Schema for searching and filtering worker profiles (Phase 3 Customer Search)
 */
export const WorkerQueryDtoSchema = z.object({
  /** Filter workers belonging to a specific service category UUID */
  categoryId: z
    .string()
    .uuid({ message: "Invalid category ID format" })
    .optional(),

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

export const UpdateWorkerProfileSchema = z.object({
  bio: z.string().optional(),
  experienceYears: z
    .number()
    .min(0, "Experience years must be non-negative")
    .optional(),
  profilePhoto: z
    .string()
    .url({ message: "Profile photo must be a valid URL" })
    .optional(),
  paymentRate: z.number().positive("Payment rate must be positive").optional(),
  availability: z.string().optional(),
});

export const CreateWorkerServiceSchema = z.object({
  categoryId: z.string().uuid({ message: "Invalid category ID format" }),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
});

export const UpdateWorkerServiceSchema = z.object({
  categoryId: z
    .string()
    .uuid({ message: "Invalid category ID format" })
    .optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
});

export const CreatePortfolioSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL" }),
  imagePublicId: z.string().min(1, "Image public ID is required").optional(),
});

export const CreateCertificateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  fileUrl: z.string().url({ message: "File URL must be a valid URL" }),
  filePublicId: z.string().min(1, "File public ID is required").optional(),
  issuedDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Issued date must be a valid ISO 8601 date string",
    })
    .optional(),
  issueDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: "Issue date must be a valid ISO 8601 date string",
    })
    .optional(),
});

export type UpdateWorkerProfileDto = z.infer<typeof UpdateWorkerProfileSchema>;
export type CreateWorkerServiceDto = z.infer<typeof CreateWorkerServiceSchema>;
export type UpdateWorkerServiceDto = z.infer<typeof UpdateWorkerServiceSchema>;
export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type CreateCertificateDto = z.infer<typeof CreateCertificateSchema>;
