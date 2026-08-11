"use client";

import { type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useExplorerTransition } from "@/providers/ExplorerTransitionProvider";
import {
  consumeArrivingDirection,
  type ExplorerDirection,
} from "@/lib/explorerTransitionState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

const VARIANTS = {
  visible: { opacity: 1, scale: 1 },
  // Personas -> Comunidades: las cards se encogen y funden al salir
  // (groupOut) y las nuevas entran creciendo desde un poco más
  // pequeñas (groupIn) — la ilusión de "agruparse".
  groupOut: { opacity: 0, scale: 0.94 },
  groupIn: { opacity: 0, scale: 0.96 },
  // Comunidades -> Personas: inversa, "dispersarse".
  spreadOut: { opacity: 0, scale: 1.05 },
  spreadIn: { opacity: 0, scale: 0.97 },
};

/** Envuelve solo la sección de resultados (nunca el header/SearchBar)
 * de Personas y Comunidades. Como es una navegación dura entre rutas
 * reales, no hay ningún estado de React que sobreviva por sí solo: el
 * "salto" se disimula en dos mitades independientes coordinadas por
 * ExplorerTransitionProvider —
 *   1) esta misma página anima su salida (groupOut/spreadOut) durante
 *      los ~150ms antes de que la navegación ocurra de verdad;
 *   2) la página destino, al montarse, lee con qué dirección llegó
 *      (consumeArrivingDirection, un singleton de módulo que sí
 *      sobrevive la navegación) y arranca desde groupIn/spreadIn en
 *      vez de su estado normal.
 * Se prefirió esto a la View Transitions API nativa porque Safari no
 * la soporta — este mecanismo es solo transform/opacity vía Framer
 * Motion y funciona en cualquier navegador. */
export default function ExplorerGridMotion({
  children,
  arriving: arrivingProp,
}: {
  children: ReactNode;
  /** El singleton de explorerTransitionState solo se puede leer una
   * vez: si la página ya lo consumió para otra cosa (p. ej. elegir
   * qué UserCards se "reconstruyen" alrededor del avatar), pásalo
   * aquí en vez de dejar que este componente lo consuma también. */
  arriving?: ExplorerDirection;
}) {
  const { leaving } = useExplorerTransition();
  const [ownArriving] = useState(() =>
    arrivingProp === undefined ? consumeArrivingDirection() : null
  );
  const arriving = arrivingProp !== undefined ? arrivingProp : ownArriving;

  const animate =
    leaving === "group" ? "groupOut" : leaving === "spread" ? "spreadOut" : "visible";

  const initial =
    arriving === "group" ? "groupIn" : arriving === "spread" ? "spreadIn" : false;

  const isLeaving = animate !== "visible";

  return (
    <motion.div
      layout="position"
      variants={VARIANTS}
      initial={initial}
      animate={animate}
      transition={{
        duration: isLeaving ? MOTION_DURATION.fast : MOTION_DURATION.normal,
        ease: MOTION_EASE.out,
      }}
    >
      {children}
    </motion.div>
  );
}
