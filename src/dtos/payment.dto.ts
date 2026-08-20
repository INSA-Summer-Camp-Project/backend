import { z } from "zod";

export const createCheckoutDto = z.object({
  applicationId: z.uuid("Invalid application ID"),
});

export type CreateCheckoutDto = z.infer<typeof createCheckoutDto>;
