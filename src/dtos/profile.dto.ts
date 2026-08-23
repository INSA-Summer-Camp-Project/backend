import { z } from "zod";

export const CreateWorkerProfileDtoSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters long"),
  experience: z.string().min(2, "Experience description is required"),
  baseRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Base rate must be a valid numeric string")
    .optional(),
  categoryIds: z
    .array(z.string().uuid("Invalid category ID format"))
    .min(1, "At least one category must be selected"),
});

export type CreateWorkerProfileDto = z.infer<
  typeof CreateWorkerProfileDtoSchema
>;

export const CreatePortfolioItemDtoSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL"),
  imagePublicId: z.string().optional(),
});

export type CreatePortfolioItemDto = z.infer<
  typeof CreatePortfolioItemDtoSchema
>;

export const CreateCertificateDtoSchema = z.object({
  title: z.string().min(2, "Title is required"),
  fileUrl: z.string().url("Invalid file URL"),
  filePublicId: z.string().optional(),
});

export type CreateCertificateDto = z.infer<typeof CreateCertificateDtoSchema>;
