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
 * components/explorer/AvatarClusterLayer.tsx.
 *
 * Timeline completo (~700ms), navegación real incluida:
 *   0ms     tap — selector e indicador reaccionan al instante
 *   0-160ms metadata de las cards sale, superficies pierden presencia
 *   60ms    los avatares empiezan a viajar (MOTION_GROUP_MORPH_DELAY)
 *   ~360ms  terminan de viajar (60 + duración del spring)
 *   360-450ms asentamiento — el cluster ya se ve completo y quieto
 *   450ms   MOTION_GROUP_TRAVEL_MS: solo AQUÍ navega de verdad
 *   450-700ms la CommunityCard se construye alrededor (ya montada
 *             en la ruta destino) — avatar-group ya visible de
 *             inmediato, superficie/título/metadata entran después
 * La navegación real no puede empezar antes de que el cluster se vea
 * prácticamente terminado, o la animación se corta a mitad — por eso
 * MOTION_GROUP_TRAVEL_MS ya no reutiliza MOTION_DURATION.fast (eso
 * era la causa del corte: el layout se desmontaba a los 150ms, antes
 * de que el spring del cluster llegara a asentarse). */

/** Spring para el "morph" de avatares agrupándose en clusters. Se usa
 * la forma duration+bounce (en vez de stiffness/damping/mass) porque
 * aquí SÍ necesitamos controlar la duración con precisión — bounce: 0
 * garantiza cero rebote, con la desaceleración natural de un spring
 * al acercarse al destino (no es un ease lineal cortado en seco). */
export const MOTION_GROUP_MORPH: Transition = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
};

/** Pequeño retraso antes de que los avatares empiecen a viajar — deja
 * que la metadata de la card salga primero, para que no se sienta
 * todo simultáneo. */
export const MOTION_GROUP_MORPH_DELAY = 0.06;

/** Cuánto espera ExplorerTransitionProvider antes de navegar de
 * verdad: el tiempo justo para que MOTION_GROUP_MORPH_DELAY +
 * MOTION_GROUP_MORPH.duration terminen y el cluster tenga un
 * instante de asentamiento visible antes del corte de página. */
export const MOTION_GROUP_TRAVEL_MS = 450;

/* --- Portal a "Tu comunidad" (icono casita) ---------------------------
 * "Entrar en tu espacio dentro de CoFlow": la pantalla actual se aleja
 * ligeramente (HomeTransitionProvider + AppShell) y Tu Comunidad
 * aparece desde profundidad (la propia página destino, al montar, lee
 * homeTransitionState). Timeline ~220-300ms:
 *   0ms    tap — tap keyframes en el icono
 *   0-130ms pantalla actual se aleja (scale/opacity/blur)
 *   130ms  MOTION_HOME_PORTAL_EXIT_MS: navega de verdad
 *   130-300ms Tu Comunidad entra desde profundidad */

/** Cuánto espera HomeTransitionProvider antes de navegar de verdad —
 * el tiempo justo para que la pantalla actual empiece a alejarse
 * antes del corte de página (misma razón que MOTION_GROUP_TRAVEL_MS). */
export const MOTION_HOME_PORTAL_EXIT_MS = 130;

/** Keyframes del tap en la casita: se presiona, sobra un poco por
 * encima de 1 al soltar y se asienta — el "rebote" es un keyframe con
 * ease, no un spring con bounce real. */
export const MOTION_HOME_TAP_SCALE = [1, 0.92, 1.04, 1];
