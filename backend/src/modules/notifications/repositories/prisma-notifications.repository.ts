import { PrismaConnector } from "../../../database/prisma.js";

import type {
  NotificationsRepository,
  CreatePushSubscriptionInput,
  PushSubscriptionEntity,
} from "./notifications.repository.js";

export class PrismaNotificationsRepository implements NotificationsRepository {
  constructor(
    private readonly prismaClient: typeof PrismaConnector = PrismaConnector,
  ) {}

  async upsert(
    input: CreatePushSubscriptionInput,
  ): Promise<PushSubscriptionEntity> {
    return this.prismaClient.pushSubscription.upsert({
      where: {
        attendanceId_endpointHash: {
          attendanceId: input.attendanceId,
          endpointHash: input.endpointHash,
        },
      },
      create: {
        ...input,
        active: true,
      },
      update: {
        sessionId: input.sessionId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        expiresAt: input.expiresAt,
        active: true,
      },
    });
  }

  async findActiveByAttendance(
    attendanceId: bigint,
  ): Promise<PushSubscriptionEntity[]> {
    return this.prismaClient.pushSubscription.findMany({
      where: {
        attendanceId,
        active: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async deactivate(id: bigint): Promise<void> {
    await this.prismaClient.pushSubscription.updateMany({
      where: { id },
      data: {
        active: false,
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prismaClient.pushSubscription.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }
}
