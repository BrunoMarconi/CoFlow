"use client";

import { useEffect, useRef, useState } from "react";

/* Oculta un elemento fijo al desplazarse hacia abajo y lo devuelve en
 * cuanto se sube, como la barra de Safari.
 *
 * Las dos constantes son las que evitan que resulte molesto: nunca se
 * esconde cerca del tope, y hace falta un gesto mínimo para cambiar de
 * estado (sin eso, el temblor del dedo o el rebote elástico de iOS la
 * harían parpadear). */

/** Por debajo de este scroll la barra siempre está visible. */
const REVEAL_ZONE_PX = 80;

/** Desplazamiento mínimo para aceptar un cambio de dirección. */
const DIRECTION_THRESHOLD_PX = 6;

export function useHideOnScroll(enabled = true) {
  const [hidden, setHidden] = useState(false);
  const [syncedEnabled, setSyncedEnabled] = useState(enabled);
  const lastScrollRef = useRef(0);

  // Al activarse o desactivarse (cambio de breakpoint) la barra vuelve a
  // estado visible: si conservara el valor anterior podría reaparecer ya
  // escondida sin que el usuario haya desplazado nada.
  if (syncedEnabled !== enabled) {
    setSyncedEnabled(enabled);
    setHidden(false);
  }

  useEffect(() => {
    if (!enabled) return;

    lastScrollRef.current = window.scrollY;

    function handleScroll() {
      const current = window.scrollY;
      const previous = lastScrollRef.current;
      const delta = current - previous;

      if (Math.abs(delta) < DIRECTION_THRESHOLD_PX) return;

      lastScrollRef.current = current;

      if (current < REVEAL_ZONE_PX) {
        setHidden(false);
        return;
      }

      setHidden(delta > 0);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  return hidden;
}
