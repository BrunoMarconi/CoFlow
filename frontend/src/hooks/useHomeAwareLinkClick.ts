"use client";

import { useCallback, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { useHomeTransition } from "@/providers/HomeTransitionProvider";

/** Intercepta el click de un <Link> de navegación (Sidebar,
 * BottomNavigation, el FAB de la casita) solo cuando entra en juego
 * "Tu comunidad": bien porque `href` es Tu Comunidad y no estamos ya
 * ahí ("enter"), bien porque ya estamos en Tu Comunidad y `href` nos
 * lleva a otro sitio ("exit"). Cualquier otro link (o un click con
 * modificador, para abrir en pestaña nueva) sigue su comportamiento
 * normal de <Link> sin tocar nada. */
export function useHomeAwareLinkClick(href: string) {
  const pathname = usePathname();
  const { isHomeRoute, requestHomeNavigate } = useHomeTransition();

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (pathname === href) return;

      const goingHome = isHomeRoute(href);
      const leavingHome = isHomeRoute(pathname);

      if (!goingHome && !leavingHome) return;

      event.preventDefault();
      requestHomeNavigate(href, goingHome ? "enter" : "exit");
    },
    [href, pathname, isHomeRoute, requestHomeNavigate]
  );
}
