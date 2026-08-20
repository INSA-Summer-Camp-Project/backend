import { SystemRole } from "@prisma/client";
import { z } from "zod";

import { paginationSchema } from "./common.dto";

export const AdminUserQueryDtoSchema = paginationSchema.extend({
  role: z.enum(SystemRole).optional(),
});
export type AdminUserQueryDto = z.infer<typeof AdminUserQueryDtoSchema>;

export const UpdateUserRoleDtoSchema = z.object({
  role: z.enum(SystemRole),
});
export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleDtoSchema>;

export const CreateCategoryDtoSchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters long")
    .max(100),
});
export type CreateCategoryDto = z.infer<typeof CreateCategoryDtoSchema>;
