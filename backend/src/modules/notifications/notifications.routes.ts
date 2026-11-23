import type { FastifyInstance } from "fastify";

import { WebPushService } from "../../shared/web-push/web-push.service.js";
import { NotificationsController } from "./notifications.controller.js";
import { NotificationsService } from "./notifications.service.js";
import { PrismaNotificationsRepository } from "./repositories/prisma-notifications.repository.js";

export async function notificationsRoutes(app: FastifyInstance) {
  const repository = new PrismaNotificationsRepository();
  const webPushService = new WebPushService();

  const service = new NotificationsService(repository, webPushService);

  const controller = new NotificationsController(service);

  app.get(
    "/client/notifications/public-key",
    controller.getPublicKey.bind(controller),
  );

  app.post(
    "/client/notifications/subscribe",
    controller.subscribe.bind(controller),
  );
}
