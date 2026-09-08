import type { Transition } from "framer-motion";

/* Tokens de motion para CoFlow — filosofía Airbnb (continuidad,
 * feedback inmediato, transiciones suaves), no su diseño visual.
 * Reutilizar estos valores en vez de números sueltos por componente,
 * para que todo el movimiento de la app se sienta consistente.
 *
 * --- Modelo físico (Apple, "Designing Fluid Interfaces") --------------
 * Apple describe un muelle con DOS parámetros de diseño en vez de la
 * tripleta física (masa/rigidez/amortiguación):
 *
 *   - damping ratio: 1.0 = crítico (llega y se para, sin rebote).
 *                    < 1.0 = sobrepasa y oscila. Cuanto más bajo, más rebote.
 *   - response:      segundos que tarda en "llegar" al destino. No es una
 *                    duración: un muelle no tiene duración fija, el tiempo
 *                    de asentamiento emerge de los parámetros.
 *
 * Regla de la casa: damping 1.0 por defecto. El rebote solo se gana
 * cuando el gesto ha traído inercia (un flick, un arrastre soltado).
 * Un menú que solo aparece no debe sobrepasar; una tarjeta que has
 * lanzado, sí. */

/** Convierte los dos parámetros de Apple a la tripleta que espera
 * framer-motion. w0 = 2p/response; k = m*w0^2; c = 2*z*m*w0. */
export function appleSpring({
  damping,
  response,
  mass = 1,
}: {
  /** Damping ratio: 1 = crítico (sin rebote), <1 = rebote. */
  damping: number;
  /** Segundos hasta alcanzar el destino. */
  response: number;
  mass?: number;
}): Transition {
  const omega = (2 * Math.PI) / response;

  return {
    type: "spring",
    stiffness: mass * omega * omega,
    damping: 2 * damping * mass * omega,
    mass,
  };
}

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

  /* --- Los tres siguientes son el modelo de Apple explícito -----------
   * `gentle` y `snappy` nacieron a ojo y resultan estar en z~0.91 y
   * z~0.83: los dos rebotan un poco. Van bien donde ya se usan (casi
   * todo lo que se mueve en la app viene de un tap), pero faltaba un
   * muelle realmente crítico para lo que aparece SIN que el usuario lo
   * haya empujado — ahí el sobrepaso se lee como un tic nervioso. */

  /** Por defecto para UI que aparece sola: crítico, no sobrepasa nunca.
   * z = 1.0, response 0.4s (el valor de "mover/recolocar" de Apple). */
  standard: appleSpring({ damping: 1, response: 0.4 }),

  /** Igual de crítico pero más corto, para piezas pequeñas (chips,
   * badges, indicadores) donde 0.4s se siente lento. */
  quick: appleSpring({ damping: 1, response: 0.28 }),

  /** Con inercia detrás: rebote leve, solo tras un gesto físico
   * (arrastre soltado, flick). z = 0.8, response 0.35s. */
  momentum: appleSpring({ damping: 0.8, response: 0.35 }),

  /** Sheets y drawers — los valores exactos que usa iOS. */
  sheet: appleSpring({ damping: 0.8, response: 0.3 }),
} as const;

/* --- Física del gesto -------------------------------------------------
 * Las tres funciones que hacen que un arrastre se sienta real: dónde va
 * a parar el dedo, cuánta velocidad hereda la animación y cuánto cede
 * un borde cuando ya no hay más recorrido. */

/** Proyecta dónde acabaría el gesto si se dejase decelerar solo — la
 * misma curva de desaceleración del scroll. Es lo que convierte un
 * flick corto en un recorrido largo: la decisión no la toma el punto
 * donde SE SOLTÓ, sino hacia dónde IBA.
 *
 * Ojo: la fórmula de libro (v^2/2a) no es la que usa Apple; la buena es
 * este decaimiento exponencial (sample code de "Designing Fluid
 * Interfaces").
 *
 * @param velocity px/s en el momento de soltar.
 * @param decelerationRate 0.998 ~ scroll normal; 0.99 más seco. */
export function projectMomentum(velocity: number, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Velocidad relativa (por segundo) para APIs de spring que la esperan
 * normalizada por la distancia que queda. framer-motion acepta px/s
 * directos, así que esto solo hace falta al animar un valor normalizado
 * (un progreso 0→1, por ejemplo). */
export function relativeVelocity(
  velocity: number,
  current: number,
  target: number
) {
  const distance = target - current;
  return distance === 0 ? 0 : velocity / distance;
}

/** Resistencia progresiva al pasarse de un límite. Un tope duro se lee
 * como "se ha colgado"; ceder cada vez menos se lee como "responde,
 * pero por aquí no hay más". */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = 0.55
) {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

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

/* --- Celebraciones ----------------------------------------------------
 * La única familia de motion de la app donde la animación SÍ es
 * protagonista, y no contradice la filosofía de velocidad de arriba: no
 * ocurre al navegar (nunca retrasa una transición ni se interpone entre
 * un tap y su pantalla), sino en los pocos momentos que merecen pausa —
 * una conexión aceptada, entrar en una comunidad, el perfil al 100%.
 * Son eventos raros y con carga emocional: aquí el coste de ~500ms se
 * paga en percepción de producto, no en fricción diaria. */

/** Spring del núcleo (avatares juntándose, medalla): más recorrido y un
 * rebote leve y perceptible, al contrario que MOTION_SPRING.gentle. */
export const MOTION_CELEBRATION_SPRING: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 18,
  mass: 0.85,
};

/** Duración del destello radial que sale del punto de encuentro. */
export const MOTION_CELEBRATION_BURST_DURATION = 0.72;

/** Distancia (px) que recorren las partículas del destello. */
export const MOTION_CELEBRATION_BURST_DISTANCE = 92;

/** Stagger entre las piezas de texto/acciones del overlay. */
export const MOTION_CELEBRATION_STAGGER = 0.07;

/** Cierre automático del overlay de celebración. Suficiente para leerlo
 * sin llegar a estorbar; siempre se puede descartar antes. */
export const MOTION_CELEBRATION_AUTO_DISMISS_MS = 3600;
