"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/* Número que cuenta desde 0 hasta su valor la primera vez que entra en
 * pantalla. Pensado para las cifras "de cabecera" (miembros, precio,
 * compatibilidad) — no para datos que cambian solos ni para tablas: si
 * todo cuenta, deja de significar nada.
 *
 * No afecta a la velocidad de navegación: arranca cuando el dato ya
 * está en pantalla, así que nunca retrasa un cambio de ruta. */

export default function CountUp({
  value,
  durationSeconds = 0.9,
  format = (current: number) => current.toLocaleString("es-ES"),
  className,
}: {
  value: number;
  durationSeconds?: number;
  format?: (current: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();
  const [counted, setCounted] = useState(0);
  // Arranca donde lo dejó, no siempre en cero: cuando el número cambia en
  // vivo (un recuento de resultados mientras se tocan filtros), volver a
  // contar desde cero cada vez se lee como un parpadeo, no como un cambio.
  const fromRef = useRef(0);

  // Con reduced motion no hay cuenta atrás que valga: se deriva el valor
  // final en render en vez de sincronizarlo por efecto.
  const display = prefersReducedMotion ? value : counted;

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    const controls = animate(fromRef.current, value, {
      duration: durationSeconds,
      ease: "easeOut",
      onUpdate: (current) => {
        fromRef.current = current;
        setCounted(Math.round(current));
      },
    });

    return () => controls.stop();
  }, [inView, value, durationSeconds, prefersReducedMotion]);

  return (
    <span ref={ref} className={className}>
      {format(display)}
    </span>
  );
}
