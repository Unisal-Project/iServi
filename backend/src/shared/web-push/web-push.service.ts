import * as webPush from "web-push";
import { env } from "../../config/env.js";

import type {
  PushSubscription,
  PushNotificationPayload,
  VapidConfig,
} from "./web-push.types.js";

export class WebPushService {
  private readonly config: VapidConfig | null;

  constructor() {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;

    this.config =
      VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT
        ? {
            publicKey: VAPID_PUBLIC_KEY,
            privateKey: VAPID_PRIVATE_KEY,
            subject: VAPID_SUBJECT,
          }
        : null;
  }

  isEnabled(): boolean {
    return this.config !== null;
  }

  getPublicKey(): string | null {
    return this.config?.publicKey ?? null;
  }

  async send(
    subscription: PushSubscription,
    payload: PushNotificationPayload,
  ): Promise<void> {
    if (!this.config) {
      throw new Error("Web Push is not configured.");
    }

    await webPush.sendNotification(subscription, JSON.stringify(payload), {
      vapidDetails: this.config,
      TTL: 300,
      urgency: "high",
      timeout: 5000,
    });
  }
}
