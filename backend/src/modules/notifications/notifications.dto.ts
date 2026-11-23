import { z } from "zod";

export const pushSubscriptionSchema = z.strictObject({
  endpoint: z.string().min(1).max(4096).url(),

  keys: z.strictObject({
    p256dh: z
      .string()
      .length(87)
      .regex(/^[A-Za-z0-9_-]+$/),

    auth: z
      .string()
      .length(22)
      .regex(/^[A-Za-z0-9_-]+$/),
  }),
});

export type PushSubscriptionDTO = z.infer<typeof pushSubscriptionSchema>;
