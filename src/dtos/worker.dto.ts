import { z } from "zod";

export const UpdateWorkerProfileSchema = z.object({
  bio: z.string().optional(),
  experienceYears: z
    .number()
    .min(0, "Experience years must be non-negative")
    .optional(),
  profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
  paymentRate: z.number().positive("Payment rate must be positive").optional(),
  availability: z.string().optional(),
});

export const CreateWorkerServiceSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
});

export const UpdateWorkerServiceSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID format").optional(),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive").optional(),
});

export const CreatePortfolioSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  imageUrl: z.string().url("Image URL must be a valid URL"),
});

export const CreateCertificateSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  fileUrl: z.string().url("File URL must be a valid URL"),
  issuedDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Issued date must be a valid ISO 8601 date string",
    })
    .optional(),
});

export type UpdateWorkerProfileDto = z.infer<typeof UpdateWorkerProfileSchema>;
export type CreateWorkerServiceDto = z.infer<typeof CreateWorkerServiceSchema>;
export type UpdateWorkerServiceDto = z.infer<typeof UpdateWorkerServiceSchema>;
export type CreatePortfolioDto = z.infer<typeof CreatePortfolioSchema>;
export type CreateCertificateDto = z.infer<typeof CreateCertificateSchema>;
