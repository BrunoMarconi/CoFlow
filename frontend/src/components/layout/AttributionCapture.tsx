"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { captureAttribution } from "@/lib/attribution";

/* Captura el origen de adquisicion en la primera pagina que se visita.
 * No pinta nada.
 *
 * Lee window.location.search en vez de useSearchParams a proposito:
 * useSearchParams obliga a render dinamico a todo lo que este por debajo,
 * y este componente vive en el layout raiz — usarlo ahi desactivaria el
 * renderizado estatico de la web entera. Dentro de un efecto, que solo
 * corre en el cliente, window.location es seguro y equivalente.
 *
 * Reacciona tambien a que alguien acepte las cookies despues de haber
 * llegado: sin esto, quien entra por /erasmus y acepta en el banner un
 * segundo mas tarde se quedaria sin atribuir, porque en el primer intento
 * todavia no habia consentimiento. */
export default function AttributionCapture() {
  const pathname = usePathname();

  useEffect(() => {
    // captureAttribution ya comprueba consentimiento y first touch, asi
    // que llamarla de mas es inofensivo: no reescribe nada.
    captureAttribution(window.location.search, pathname);

    function onConsentChange() {
      captureAttribution(window.location.search, window.location.pathname);
    }

    window.addEventListener("coflow:cookie-consent-changed", onConsentChange);
    return () => window.removeEventListener("coflow:cookie-consent-changed", onConsentChange);
  }, [pathname]);

  return null;
}
