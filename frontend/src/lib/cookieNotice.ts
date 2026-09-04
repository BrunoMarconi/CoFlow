export type CookieConsent = { version: 1; necessary: true; analytics: boolean; preferences: boolean; decidedAt: string };

const KEY = "coflow:cookie-consent";
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null") as CookieConsent | null;
    if (!value || value.version !== 1 || Date.now() - new Date(value.decidedAt).getTime() > MAX_AGE) return null;
    return value;
  } catch { return null; }
}

export function saveCookieConsent(options: Pick<CookieConsent, "analytics" | "preferences">) {
  const value: CookieConsent = { version: 1, necessary: true, ...options, decidedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(value));
  if (!options.analytics) localStorage.removeItem("coflow:analytics-session");
  window.dispatchEvent(new CustomEvent("coflow:cookie-consent-changed", { detail: value }));
}
