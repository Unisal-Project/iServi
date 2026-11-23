import { registerPushSubscription } from "@/services/push-notifications.service";

export function isPushSupported(): boolean {
  return (
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function subscribeToPush(
  session: string,
  publicKey: string,
): Promise<boolean> {
  if (!isPushSupported() || !session || !publicKey) {
    return false;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: publicKey,
    });
  }

  const { endpoint, keys } = subscription.toJSON();

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error("Inscrição push inválida.");
  }

  await registerPushSubscription(session, {
    endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return true;
}
