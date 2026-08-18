// Aviso informativo de cookies (solo se usan cookies estrictamente
// necesarias — sesión/autenticación — exentas de consentimiento bajo
// RGPD/LSSI-CE; ver frontend/src/app/legal/cookies/page.tsx). No es un
// banner de consentimiento con aceptar/rechazar, solo se recuerda que
// ya se mostró para no repetirlo en cada visita.
const COOKIE_NOTICE_SEEN_KEY = "coflow:cookie-notice-seen";

export function hasSeenCookieNotice(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(COOKIE_NOTICE_SEEN_KEY) === "1";
}

export function markCookieNoticeSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_NOTICE_SEEN_KEY, "1");
}
