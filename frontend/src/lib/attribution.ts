/* Atribucion de adquisicion "first touch": de donde vino alguien la
 * PRIMERA vez que piso CoFlow, para poder saber luego cuantos registros
 * trajo cada campana.
 *
 * First touch significa que el primer origen gana y no se reescribe: si
 * alguien entra por /erasmus, navega por la web y se registra cinco
 * minutos despues, se sigue atribuyendo a ESN. Solo se vuelve a capturar
 * cuando el dato guardado ha caducado.
 *
 * Almacenamiento first-party (localStorage), el mismo patron que
 * cookieNotice y analytics: nada viaja a terceros y todo va envuelto en
 * try/catch porque en ventana privada el acceso lanza.
 *
 * Detras del consentimiento de analitica, igual que trackProductEvent:
 * la categoria "Analitica" del banner ya describe justo esto ("eventos
 * propios y minimizados para mejorar el embudo"). Sin ese consentimiento
 * no se guarda nada y los registros se crean con la atribucion vacia. */

import { getCookieConsent } from "./cookieNotice";

export type Attribution = {
  version: 1;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  capturedAt: string;
};

const KEY = "coflow:attribution";

/** 30 dias. Sin caducidad, una visita de hace meses atribuiria un
 * registro de hoy a una campana que ya termino. */
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/** Ancho de la columna en Postgres (users.signup_source y hermanas). */
const MAX_LENGTH = 64;

/* Rutas que identifican una campana por si mismas, sin necesidad de que
 * el enlace traiga UTMs. /erasmus es la landing del acuerdo con ESN
 * Malaga: quien llega ahi viene de ESN aunque el enlace se haya
 * compartido pelado, por WhatsApp o de viva voz. Los UTMs explicitos de
 * la URL siempre tienen prioridad sobre esta tabla. */
const ROUTE_CAMPAIGNS: Record<string, { source: string; medium: string; campaign: string }> = {
  "/erasmus": { source: "esn_malaga", medium: "partner", campaign: "erasmus_2026" },
};

function clean(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase().slice(0, MAX_LENGTH);
  return trimmed || null;
}

/** Lo guardado, o null si no hay consentimiento vigente, no hay nada,
 * esta corrupto o ha caducado. */
export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  // Segundo candado, ademas del borrado que hace saveCookieConsent: si el
  // consentimiento ya no esta vigente no se devuelve atribucion aunque
  // quedara algo escrito (borrado que fallo, pestana abierta desde antes,
  // consentimiento caducado por los 180 dias de getCookieConsent).
  if (!getCookieConsent()?.analytics) return null;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null") as Attribution | null;
    if (!stored || stored.version !== 1) return null;
    if (Date.now() - new Date(stored.capturedAt).getTime() > MAX_AGE) return null;
    return stored;
  } catch {
    return null;
  }
}

/** Los tres campos tal y como los espera el backend. Sin atribucion
 * devuelve un objeto vacio, y el alta se crea con los campos a NULL. */
export function attributionPayload(): {
  signup_source?: string;
  signup_medium?: string;
  signup_campaign?: string;
} {
  const stored = readAttribution();
  if (!stored) return {};

  return {
    ...(stored.source ? { signup_source: stored.source } : {}),
    ...(stored.medium ? { signup_medium: stored.medium } : {}),
    ...(stored.campaign ? { signup_campaign: stored.campaign } : {}),
  };
}

/**
 * Captura el origen si todavia no hay uno vigente guardado.
 *
 * @returns true si ha escrito algo nuevo.
 */
export function captureAttribution(search: string, pathname: string): boolean {
  if (typeof window === "undefined") return false;
  // Mismo candado que trackProductEvent.
  if (!getCookieConsent()?.analytics) return false;
  // First touch: si ya hay un origen vigente, no se toca.
  if (readAttribution()) return false;

  const params = new URLSearchParams(search);
  let source = clean(params.get("utm_source"));
  let medium = clean(params.get("utm_medium"));
  let campaign = clean(params.get("utm_campaign"));

  // Sin UTMs en la URL, la propia ruta puede identificar la campana.
  if (!source && !medium && !campaign) {
    const fromRoute = ROUTE_CAMPAIGNS[pathname];
    if (!fromRoute) return false;
    source = fromRoute.source;
    medium = fromRoute.medium;
    campaign = fromRoute.campaign;
  }

  // Una URL con utm_content pero sin source/medium/campaign no dice de
  // donde viene nadie: no merece ocupar el hueco del first touch.
  if (!source && !medium && !campaign) return false;

  try {
    const value: Attribution = {
      version: 1,
      source,
      medium,
      campaign,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
