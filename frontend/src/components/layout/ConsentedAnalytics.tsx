"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";

import { getCookieConsent } from "@/lib/cookieNotice";

/* Vercel Web Analytics (solo pageviews), montado unicamente si la persona
 * ha aceptado la analitica en el banner.
 *
 * El mismo candado que usa trackProductEvent. Vercel Web Analytics no usa
 * cookies, pero sigue siendo una herramienta de un tercero, y la politica
 * de cookies de CoFlow declara la analitica como opcional y desactivada
 * hasta que se acepta. Montarlo siempre contradiria ese texto.
 *
 * Al no renderizarse, el script ni siquiera se descarga. */
export default function ConsentedAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    function sync() {
      setAllowed(Boolean(getCookieConsent()?.analytics));
    }

    sync();
    // saveCookieConsent emite este evento, asi que aceptar o retirar el
    // consentimiento monta o desmonta el script sin recargar la pagina.
    window.addEventListener("coflow:cookie-consent-changed", sync);
    return () => window.removeEventListener("coflow:cookie-consent-changed", sync);
  }, []);

  if (!allowed) return null;

  return <Analytics />;
}
