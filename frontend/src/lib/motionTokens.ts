import type { Transition } from "framer-motion";

/* Tokens de motion para CoFlow — filosofía Airbnb (continuidad,
 * feedback inmediato, transiciones suaves), no su diseño visual.
 * Reutilizar estos valores en vez de números sueltos por componente,
 * para que todo el movimiento de la app se sienta consistente. */

export const MOTION_DURATION = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
} as const;

export const MOTION_EASE = {
  standard: [0.4, 0, 0.2, 1] as const,
  out: "easeOut" as const,
};

export const MOTION_SPRING = {
  /** Springs para elementos grandes (modales, shared elements): llega
   * rápido pero sin rebote perceptible. */
  gentle: {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.9,
  } as Transition,
  /** Springs para detalles pequeños (indicadores, pills): un poco más
   * ágil, sigue sin rebote exagerado. */
  snappy: {
    type: "spring",
    stiffness: 420,
    damping: 34,
  } as Transition,
} as const;

/** Stagger muy ligero para listas de info dentro de un panel/modal —
 * nunca debe notarse como una "animación", solo suavizar la entrada. */
export const MOTION_STAGGER_CHILDREN = 0.05;
