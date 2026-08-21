import { z } from "zod";

export const CreateReportDtoSchema = z.object({
  reportedId: z.uuid("Invalid user ID format"),
  jobId: z.uuid("Invalid job ID format").optional(),
  reason: z.enum([
    "SCAM",
    "INAPPROPRIATE_BEHAVIOR",
    "NO_SHOW",
    "POOR_QUALITY",
    "OTHER",
  ]),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters long")
    .max(1000, "Description cannot exceed 1000 characters"),
});

export type CreateReportDto = z.infer<typeof CreateReportDtoSchema>;

export const UpdateReportStatusDtoSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]),
});

export type UpdateReportStatusDto = z.infer<typeof UpdateReportStatusDtoSchema>;
