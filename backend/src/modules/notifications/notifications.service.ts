import { createHash } from "node:crypto";
import { AppError } from "../../shared/errors/app-errors.js";
import { WebPushService } from "../../shared/web-push/web-push.service.js";

import type {
  PushSubscription,
  PushNotificationPayload,
} from "../../shared/web-push/web-push.types.js";

import type { NotificationsRepository } from "./repositories/notifications.repository.js";

export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly webPushService: WebPushService,
  ) {}

  isEnabled(): boolean {
    return this.webPushService.isEnabled();
  }

  getPublicKey(): string | null {
    return this.webPushService.getPublicKey();
  }

  async deleteExpiredSubscriptions(): Promise<number> {
    return this.repository.deleteExpired();
  }

  async subscribe(
    attendanceId: bigint,
    sessionId: string,
    subscription: PushSubscription,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.isEnabled()) {
      throw new AppError("Notificações indisponíveis.", 503);
    }

    if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new AppError("Sessão de atendimento expirada.", 403);
    }

    this.validateEndpoint(subscription.endpoint);

    const endpointHash = createHash("sha256")
      .update(subscription.endpoint)
      .digest("hex");

    await this.repository.upsert({
      attendanceId,
      sessionId,
      endpoint: subscription.endpoint,
      endpointHash,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expiresAt,
    });
  }

  async notifyAttendance(
    attendanceId: bigint,
    payload: PushNotificationPayload,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.isEnabled()) {
      return { sent: 0, failed: 0 };
    }

    const subscriptions =
      await this.repository.findActiveByAttendance(attendanceId);

    let sent = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      try {
        this.validateEndpoint(subscription.endpoint);

        await this.webPushService.send(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );

        sent++;
      } catch (error) {
        failed++;

        const statusCode = (error as { statusCode?: number })?.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await this.repository.deactivate(subscription.id);
        }
      }
    }

    return { sent, failed };
  }

  private validateEndpoint(endpoint: string): void {
    let url: URL;

    try {
      url = new URL(endpoint);
    } catch {
      throw new AppError("Endpoint de notificação inválido.", 400);
    }

    const hostname = url.hostname;

    const allowed =
      hostname === "fcm.googleapis.com" ||
      hostname === "updates.push.services.mozilla.com" ||
      hostname.endsWith(".push.apple.com");

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      !allowed
    ) {
      throw new AppError("Endpoint de notificação não permitido.", 400);
    }
  }
}
