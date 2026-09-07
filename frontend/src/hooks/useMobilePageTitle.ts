"use client";

import { useEffect } from "react";
import { useMobileChrome } from "@/providers/MobileChromeProvider";

/* Publica el título de la pantalla para que la barra superior lo adopte
 * al desplazarse (large title de iOS).
 *
 * Está separado de MobileLargeTitle porque cada pantalla tiene su propia
 * cabecera — unas con foto, otras dentro de una tarjeta — y obligarlas a
 * todas a renderizar el mismo componente costaría reescribirlas. Con el
 * hook basta para que el relevo hacia la barra funcione igual en todas;
 * MobileLargeTitle añade además el título grande que se encoge. */

/** Scroll (px) a partir del cual la barra toma el relevo. */
export const TITLE_HANDOFF_DISTANCE = 44;

export function useMobilePageTitle(title: string | null) {
  const { setPageTitle, setTitleCollapsed } = useMobileChrome();

  useEffect(() => {
    if (!title) return;

    setPageTitle(title);

    return () => setPageTitle(null);
  }, [title, setPageTitle]);

  useEffect(() => {
    if (!title) return;

    // El relevo se decide por la posición real de scroll, no por un
    // observer sobre el título: así la barra no parpadea cuando el
    // contenido de la página cambia de alto al cargar.
    function sync() {
      setTitleCollapsed(window.scrollY > TITLE_HANDOFF_DISTANCE);
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });

    return () => window.removeEventListener("scroll", sync);
  }, [title, setTitleCollapsed]);
}
