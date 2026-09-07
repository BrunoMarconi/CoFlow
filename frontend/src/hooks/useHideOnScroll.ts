"use client";

import { useEffect, useRef, useState } from "react";

/* Oculta un elemento fijo al desplazarse hacia abajo y lo devuelve en
 * cuanto se sube, como la barra de Safari.
 *
 * El gesto se mide acumulado, no evento a evento: los eventos de scroll
 * llegan cada pocos píxeles, así que comparar solo con el anterior haría
 * que cualquier roce cambiara el estado. Se suma el recorrido mientras
 * va en la misma dirección y el cambio se acepta al superar el umbral;
 * al invertir la dirección, el contador vuelve a empezar. */

/** Por debajo de este scroll la barra siempre está visible. Cubre de
 * sobra el título grande, para que esconderla sea una decisión de quien
 * está leyendo una lista larga y no algo que pase al primer gesto. */
const REVEAL_ZONE_PX = 220;

/** Recorrido acumulado en una dirección para aceptar el cambio. */
const DIRECTION_THRESHOLD_PX = 64;

export function useHideOnScroll(enabled = true) {
  const [hidden, setHidden] = useState(false);
  const [syncedEnabled, setSyncedEnabled] = useState(enabled);
  const lastScrollRef = useRef(0);
  const accumulatedRef = useRef(0);

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
    accumulatedRef.current = 0;

    function handleScroll() {
      const current = window.scrollY;
      const delta = current - lastScrollRef.current;
      lastScrollRef.current = current;

      if (delta === 0) return;

      if (current < REVEAL_ZONE_PX) {
        accumulatedRef.current = 0;
        setHidden(false);
        return;
      }

      // Cambio de sentido: el recorrido anterior ya no cuenta.
      if (Math.sign(delta) !== Math.sign(accumulatedRef.current)) {
        accumulatedRef.current = delta;
      } else {
        accumulatedRef.current += delta;
      }

      if (Math.abs(accumulatedRef.current) < DIRECTION_THRESHOLD_PX) return;

      setHidden(accumulatedRef.current > 0);
      accumulatedRef.current = 0;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  return hidden;
}
