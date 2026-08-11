"use client";

import { useCallback, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useExplorerTransition } from "@/providers/ExplorerTransitionProvider";

const EXPLORER_ROUTES = new Set(["/comunidades", "/usuarios"]);

/** Intercepta el click de un <Link> de navegación (Sidebar,
 * BottomNavigation) solo cuando va de Personas a Comunidades o
 * viceversa, dejando que ExplorerTransitionProvider anime la salida
 * antes de navegar de verdad. Cualquier otro link (o un click con
 * modificador, para abrir en pestaña nueva) sigue su comportamiento
 * normal de <Link> sin tocar nada. */
export function useExplorerLinkClick(href: string) {
  const pathname = usePathname();
  const { leaving, requestNavigate, cancelLeaving } = useExplorerTransition();

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!EXPLORER_ROUTES.has(href)) return;
      if (!EXPLORER_ROUTES.has(pathname)) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (pathname === href) {
        // Pulsar el link de la sección en la que ya estamos solo
        // importa si hay una salida en curso hacia la otra — cancela
        // la navegación diferida y deja que la coreografía revierta
        // en vez de esperar a que termine para volver enseguida.
        if (leaving) {
          event.preventDefault();
          cancelLeaving();
        }
        return;
      }

      event.preventDefault();
      requestNavigate(href as "/comunidades" | "/usuarios");
    },
    [href, pathname, leaving, requestNavigate, cancelLeaving]
  );
}
