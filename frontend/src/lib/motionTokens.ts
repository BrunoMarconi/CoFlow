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

/* --- Search Mode (Personas/Comunidades) ------------------------------
 * Tokens específicos de la coreografía "SearchBar se convierte en
 * header": la transformación de layout principal reutiliza
 * MOTION_SPRING.gentle (ya es un spring controlado, sin rebote
 * perceptible, ~300-380ms sentidos) — estos dos son los únicos
 * valores nuevos que introduce Search Mode, y viven aquí para que
 * cualquier otra pantalla que adopte el mismo patrón los reutilice
 * en vez de inventar números sueltos. */

/** Duración del "despegue" físico de la SearchBar al pulsarla — tap
 * scale-down + recuperación, antes de que arranque la transformación
 * de layout. */
export const MOTION_SEARCH_LIFT_DURATION = 0.1;

/** Stagger ajustado (20-30ms) para elementos que "nacen" de un
 * elemento en movimiento (filtros desplegándose desde la SearchBar,
 * resultados reorganizándose en tiempo real) — a diferencia de
 * MOTION_STAGGER_CHILDREN, aquí la coreografía SÍ debe notarse. */
export const MOTION_STAGGER_TIGHT = 0.025;

/* --- Transición Personas <-> Comunidades ------------------------------
 * "Las personas se agrupan para formar comunidades" (y a la inversa).
 * Ver providers/ExplorerTransitionProvider.tsx y
 * components/explorer/AvatarClusterLayer.tsx. */

/** Spring para el "morph" de avatares agrupándose en clusters:
 * damping alto a propósito (sin rebote perceptible, movimiento muy
 * controlado) — más lento que MOTION_SPRING.snappy porque aquí el
 * recorrido debe leerse como "personas reuniéndose", no como un
 * detalle de UI reaccionando a un tap. */
export const MOTION_GROUP_MORPH: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 32,
  mass: 1,
};
