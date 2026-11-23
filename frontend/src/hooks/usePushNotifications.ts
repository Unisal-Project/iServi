import { useEffect, useState } from "react";

import { fetchPushConfig } from "@/services/push-notifications.service";
import { isPushSupported, subscribeToPush } from "@/utils/pwa/subscribeToPush";

export function usePushNotifications(session: string) {
  const [supported] = useState(isPushSupported);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;

    let cancelled = false;

    async function loadConfig() {
      try {
        const config = await fetchPushConfig();

        if (!cancelled && config.enabled) {
          setPublicKey(config.publicKey);
        }
      } catch {
        if (!cancelled) {
          setError("Notificações indisponíveis.");
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, [supported]);

  useEffect(() => {
    setSubscribed(false);
    setError(null);
  }, [session]);

  async function subscribe() {
    if (!session || !publicKey || loading) return;

    setLoading(true);
    setError(null);

    try {
      const success = await subscribeToPush(session, publicKey);

      setSubscribed(success);
    } catch {
      setError("Não foi possível ativar as notificações.");
    } finally {
      setLoading(false);
    }
  }

  return {
    supported,
    available: supported && Boolean(publicKey) && Boolean(session),
    subscribed,
    loading,
    error,
    subscribe,
  };
}
