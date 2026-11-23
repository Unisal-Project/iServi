export interface CreatePushSubscriptionInput {
  attendanceId: bigint;
  sessionId: string;
  endpoint: string;
  endpointHash: string;
  p256dh: string;
  auth: string;
  expiresAt: Date;
}

export interface PushSubscriptionEntity extends CreatePushSubscriptionInput {
  id: bigint;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationsRepository {
  upsert(input: CreatePushSubscriptionInput): Promise<PushSubscriptionEntity>;

  findActiveByAttendance(
    attendanceId: bigint,
  ): Promise<PushSubscriptionEntity[]>;

  deactivate(id: bigint): Promise<void>;

  deleteExpired(): Promise<number>;
}
