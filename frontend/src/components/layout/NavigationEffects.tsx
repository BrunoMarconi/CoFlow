"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Normaliza el punto de entrada de cada pantalla nueva (empieza arriba
 * del todo). Los hilos de chat gestionan su propio scroll para poder
 * abrirse directamente en el último mensaje.
 *
 * Al volver atrás (botón "Volver", gesto del navegador) NO se resetea:
 * el propio navegador restaura la posición de scroll de esa pantalla
 * tal como estaba — resetear aquí encima la pisaría. Un `popstate` es
 * la única señal fiable de que la navegación fue "atrás/adelante" y no
 * un push normal (Link, router.push).
 */
export default function NavigationEffects() {
  const pathname = usePathname();
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    function handlePopState() {
      isPopNavigationRef.current = true;
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/mensajes/")) return;

    if (isPopNavigationRef.current) {
      isPopNavigationRef.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
