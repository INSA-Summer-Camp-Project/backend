import { z } from "zod";

import { paginationSchema } from "@/dtos/common.dto";

export const NotificationQueryDtoSchema = paginationSchema.extend({});

export type NotificationQueryDto = z.infer<typeof NotificationQueryDtoSchema>;
