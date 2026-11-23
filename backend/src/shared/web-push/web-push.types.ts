export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    type?: string;
    eventId?: string;
  };
}

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}
