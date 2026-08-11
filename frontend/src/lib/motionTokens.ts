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

/* --- Personas <-> Comunidades: crossfade rápido ------------------------
 * Reemplaza por completo la antigua transición "las personas se
 * agrupan para formar comunidades" (avatar-cluster/group-morph) — se
 * sentía protagonista y lenta (~700ms). Aquí la prioridad es
 * velocidad percibida: mismo mecanismo que Personas <-> Tu Comunidad
 * (ver más abajo) — AppShell detecta el cambio de ruta y anima solo
 * la entrada del contenido que ya está montado, sin retrasar la
 * navegación ni una vez. Sin stagger, sin cards animándose una a una,
 * sin blur/scale/spring. */

/** Distancia horizontal — más perceptible en móvil, casi nula en
 * desktop. */
export const MOTION_EXPLORER_NAV_DISTANCE_MOBILE = 8;
export const MOTION_EXPLORER_NAV_DISTANCE_DESKTOP = 5;

/** Duración total: ~120ms en móvil, ~110ms en desktop. */
export const MOTION_EXPLORER_NAV_DURATION_MOBILE = 0.12;
export const MOTION_EXPLORER_NAV_DURATION_DESKTOP = 0.11;

/** Con prefers-reduced-motion: solo fade. */
export const MOTION_EXPLORER_NAV_REDUCED_DURATION = 0.08;

/* --- Personas <-> Tu Comunidad: crossfade rápido -----------------------
 * Prioridad absoluta: velocidad percibida. La navegación ya no espera
 * a ninguna animación (antes se retrasaba el router.push para poder
 * mostrar una salida "bonita" — eso es justo lo que hacía sentir la
 * app lenta). Ahora AppShell simplemente detecta el cambio de ruta
 * (comparando si la anterior/nueva son "Tu Comunidad") y anima SOLO
 * la entrada de la pantalla que ya está montada — no hay fase de
 * salida real, la pantalla anterior se destruye al instante con la
 * navegación dura. Sin stagger, sin blur, sin scale/zoom, sin spring:
 * un fade + desplazamiento horizontal mínimo con easing simple. */

/** Distancia horizontal del crossfade — más perceptible en móvil, casi
 * nula en desktop (misma idea, menos recorrido). */
export const MOTION_HOME_NAV_DISTANCE_MOBILE = 8;
export const MOTION_HOME_NAV_DISTANCE_DESKTOP = 5;

/** Duración total del crossfade: ~140ms en móvil, ~120ms en desktop —
 * casi imperceptible a propósito. */
export const MOTION_HOME_NAV_DURATION_MOBILE = 0.14;
export const MOTION_HOME_NAV_DURATION_DESKTOP = 0.12;

/** Con prefers-reduced-motion: solo fade, más corto todavía. */
export const MOTION_HOME_NAV_REDUCED_DURATION = 0.09;

/** whileTap de la casita — solo scale, nada más. */
export const MOTION_HOME_TAP_SCALE = 0.94;

/* --- Perfil <-> Perfil público (propio) --------------------------------
 * Única transición "especial" de la app: al pulsar la cabecera de
 * identidad en Perfil, la pantalla entrante gira levemente en el eje Y
 * (perspectiva sutil, no un flip de carta) mientras se desliza y funde.
 * Misma arquitectura que el resto de cruces de AppShell (imperative
 * controls sobre el contenido ya montado, sin retrasar la navegación),
 * pero con más recorrido y duración porque el propio pedido la marca
 * como la pieza "premium" de la pantalla — el resto de la app debe
 * seguir sintiéndose instantánea, esta es la única excepción medida. */

export const MOTION_PROFILE_PUBLIC_NAV_DISTANCE_MOBILE = 24;
export const MOTION_PROFILE_PUBLIC_NAV_DISTANCE_DESKTOP = 16;

/** ~280ms — dentro del objetivo 250-320ms del pedido. */
export const MOTION_PROFILE_PUBLIC_NAV_DURATION = 0.28;

/** Inclinación 3D sutil (grados) con la que entra/sale el contenido —
 * lejos de un flip de 90°, solo un toque de profundidad. */
export const MOTION_PROFILE_PUBLIC_NAV_TILT_DEG = 6;

/** Con prefers-reduced-motion: solo fade, sin desplazamiento ni giro. */
export const MOTION_PROFILE_PUBLIC_NAV_REDUCED_DURATION = 0.1;
