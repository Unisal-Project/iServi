import type { FastifyInstance } from "fastify";

import { PaymentController } from "./payment.controller.js";
import { PaymentService } from "./payment.service.js";
import { readPaymentConfirmation } from "./payment-confirmation.js";

import { NotificationsService } from "../notifications/notifications.service.js";
import { PrismaNotificationsRepository } from "../notifications/repositories/prisma-notifications.repository.js";
import { WebPushService } from "../../shared/web-push/web-push.service.js";

export async function paymentRoutes(app: FastifyInstance) {
  const notificationsService = new NotificationsService(
    new PrismaNotificationsRepository(),
    new WebPushService(),
  );

  const paymentService = new PaymentService(undefined, async (attendanceId) => {
    if (!notificationsService.isEnabled()) return;

    const confirmation = await readPaymentConfirmation(attendanceId);

    if (confirmation.status !== "confirmed" || !confirmation.event) {
      return;
    }

    const result = await notificationsService.notifyAttendance(attendanceId, {
      title: "Pagamento confirmado!",
      body: "Sua conta foi paga com sucesso. Obrigado pela visita!",
      icon: "/favicon.png",
      tag: confirmation.event.id,
      data: {
        type: confirmation.event.type,
        eventId: confirmation.event.id,
      },
    });

    app.log.info(
      {
        attendanceId: attendanceId.toString(),
        ...result,
      },
      "Notificações de pagamento processadas",
    );
  });

  const controller = new PaymentController(paymentService);

  app.post("/attendances/:attendanceId/close", (request, reply) =>
    controller.close(request, reply),
  );

  app.post("/attendances/:attendanceId/reopen", (request, reply) =>
    controller.reopen(request, reply),
  );

  app.post("/attendances/:attendanceId/confirm-payment", (request, reply) =>
    controller.confirm(request, reply),
  );
}
