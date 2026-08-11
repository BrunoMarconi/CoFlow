"use client";

import { useCallback, type MouseEvent } from "react";
import { useHomeTransition } from "@/providers/HomeTransitionProvider";

/** Intercepta el click del icono de la casita ("Tu comunidad") para
 * dejar que la pantalla actual se aleje antes de navegar de verdad —
 * ver HomeTransitionProvider. Un click con modificador (abrir en
 * pestaña nueva, etc.) sigue su comportamiento normal de <Link>. */
export function useHomeIconClick(target: string) {
  const { requestHomeNavigate } = useHomeTransition();

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      requestHomeNavigate(target);
    },
    [target, requestHomeNavigate]
  );
}
