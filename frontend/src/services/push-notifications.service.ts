import { apiRequest } from "@/api/client";

interface PushConfig {
  enabled: boolean;
  publicKey: string | null;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function fetchPushConfig() {
  return apiRequest<PushConfig>("/client/notifications/public-key");
}

export function registerPushSubscription(
  session: string,
  subscription: PushSubscriptionData,
) {
  return apiRequest<void>("/client/notifications/subscribe", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify(subscription),
  });
}
