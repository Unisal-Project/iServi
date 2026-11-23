import { useState } from "react";
import { BellRing, X } from "lucide-react";

import { usePushNotifications } from "@/hooks/usePushNotifications";

import "./styles.scss";

interface PushNotificationPromptProps {
  session: string;
}

export function PushNotificationPrompt({
  session,
}: PushNotificationPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  const { available, subscribed, loading, error, subscribe } =
    usePushNotifications(session);

  if (!available || subscribed || dismissed) {
    return null;
  }

  return (
    <aside className="push-notification-prompt">
      <button
        type="button"
        className="push-notification-prompt__close"
        aria-label="Dispensar notificações"
        onClick={() => setDismissed(true)}
      >
        <X size={18} />
      </button>

      <div className="push-notification-prompt__icon">
        <BellRing size={26} />
      </div>

      <h3>Ative as notificações</h3>

      <p>
        Receba uma notificação quando o pagamento da sua conta for confirmado,
        mesmo com o cardápio fechado.
      </p>

      {error && (
        <span role="alert" className="push-notification-prompt__error">
          {error}
        </span>
      )}

      <button
        type="button"
        className="push-notification-prompt__action"
        disabled={loading}
        onClick={() => void subscribe()}
      >
        {loading ? "Ativando..." : "Ativar notificações"}
      </button>

      <button
        type="button"
        className="push-notification-prompt__dismiss"
        onClick={() => setDismissed(true)}
      >
        Agora não
      </button>
    </aside>
  );
}
