import { getToken } from "@/lib/auth";
import { getCookieConsent } from "@/lib/cookieNotice";

export type ProductEventName =
  | "page_view"
  | "signup_completed"
  | "login_completed"
  | "onboarding_completed"
  | "profile_viewed"
  | "connection_requested"
  | "message_sent"
  | "application_submitted"
  | "community_created";

const SESSION_KEY = "coflow:analytics-session";

function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

/** Elimina identificadores de recursos y tokens antes de persistir una ruta. */
export function normalizeAnalyticsPath(path: string) {
  return path
    .split("?")[0]
    .split("/")
    .map((segment) =>
      /^\d+$/.test(segment) ||
      /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(segment) ||
      segment.length > 32
        ? ":id"
        : segment
    )
    .join("/")
    .slice(0, 255);
}

export function clearAnalyticsSession() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

export function trackProductEvent(name: ProductEventName, path = window.location.pathname) {
  if (typeof window === "undefined" || !getCookieConsent()?.analytics) return;

  const token = getToken();
  void fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/analytics/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      event_id: crypto.randomUUID(),
      session_id: getSessionId(),
      name,
      path: normalizeAnalyticsPath(path),
      source: "web",
    }),
    keepalive: true,
  }).catch(() => {
    // La analítica nunca debe bloquear ni degradar el recorrido principal.
  });
}
