import { z } from "zod";

export const updateWorkerProfileSchema = z.object({
  bio: z
    .string()
    .min(10, "Bio must be at least 10 characters")
    .max(1000)
    .optional(),
  experience: z
    .string()
    .min(5, "Experience must be at least 5 characters")
    .max(500)
    .optional(),
  baseRate: z.coerce.number().positive("Base rate must be positive").optional(),
  categoryIds: z
    .array(z.string().uuid("Invalid category ID format"))
    .optional(),
});

export type UpdateWorkerProfileDto = z.infer<typeof updateWorkerProfileSchema>;

export const createPortfolioSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  imageUrl: z.string().url(),
  imagePublicId: z.string().min(1),
});

export type CreatePortfolioDto = z.infer<typeof createPortfolioSchema>;

export const createCertificateSchema = z.object({
  title: z.string().min(3).max(100),
  fileUrl: z.string().url(),
  filePublicId: z.string().min(1),
});

export type CreateCertificateDto = z.infer<typeof createCertificateSchema>;
