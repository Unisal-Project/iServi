import type { FastifyReply, FastifyRequest } from "fastify";

import { NotificationsService } from "./notifications.service.js";
import { pushSubscriptionSchema } from "./notifications.dto.js";

type PaymentSession = {
  purpose: string;
  attendanceId: string;
  sessionId: string;
  exp: number;
};

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  async getPublicKey(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      enabled: this.service.isEnabled(),
      publicKey: this.service.getPublicKey(),
    });
  }

  async subscribe(request: FastifyRequest, reply: FastifyReply) {
    const session = this.getPaymentSession(request);

    if (!session) {
      return reply.code(403).send({
        message: "Sessão de atendimento inválida.",
      });
    }

    const result = pushSubscriptionSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        message: "Inscrição de notificação inválida.",
      });
    }

    await this.service.subscribe(
      BigInt(session.attendanceId),
      session.sessionId,
      result.data,
      new Date(session.exp * 1000),
    );

    return reply.code(204).send();
  }

  private getPaymentSession(request: FastifyRequest): PaymentSession | null {
    const token = /^Bearer (\S+)$/.exec(
      request.headers.authorization ?? "",
    )?.[1];

    if (!token) return null;

    try {
      const session = request.server.jwt.verify<PaymentSession>(token);

      if (
        session.purpose !== "customer-payment-confirmation" ||
        typeof session.sessionId !== "string" ||
        !session.sessionId ||
        typeof session.attendanceId !== "string" ||
        !/^[1-9]\d*$/.test(session.attendanceId) ||
        !Number.isSafeInteger(session.exp) ||
        session.exp <= Date.now() / 1000
      ) {
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }
}
