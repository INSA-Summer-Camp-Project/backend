import { z } from "zod";

/**
 * Schema for updating Customer Profile
 */
export const UpdateCustomerProfileSchema = z.object({
  bio: z.string().max(1000, "Bio cannot exceed 1000 characters").optional(),
  profilePhoto: z.string().url("Profile photo must be a valid URL").optional(),
});

export type UpdateCustomerProfileDto = z.infer<
  typeof UpdateCustomerProfileSchema
>;

/**
 * Customer Public Profile response shape
 */
export interface CustomerPublicDto {
  id: string;
  userId: string;
  bio: string | null;
  profilePhoto: string | null;
  ratingAvg: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  totalJobsPosted: number;
  totalCompletedJobs: number;
}
