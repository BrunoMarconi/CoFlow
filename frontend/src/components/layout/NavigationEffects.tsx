"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Normaliza el punto de entrada de cada pantalla. Los hilos de chat gestionan
 * su propio scroll para poder abrirse directamente en el último mensaje.
 */
export default function NavigationEffects() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/mensajes/")) return;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
