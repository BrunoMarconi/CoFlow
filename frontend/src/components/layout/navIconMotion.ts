import type { TargetAndTransition, Variants } from "framer-motion";
import {
  CompassIcon,
  HomeIcon,
  KeyIcon,
  MessageIcon,
  ProfileIcon,
  SettingsIcon,
  UsersIcon,
  type IconProps,
} from "@/components/layout/NavIcons";

/* Cada icono de navegación tiene su propio gesto al activarse, en vez del
 * mismo saltito para todos: la brújula busca el norte, la llave gira en
 * la cerradura, la burbuja se agita como un mensaje que llega... Es lo
 * que hace que cambiar de pestaña se sienta como tocar objetos distintos.
 *
 * Cada gesto es una función de la intensidad `k`: 1 al activarse, ~0.5
 * al pasar el ratón por encima (en el sidebar), para que el hover sea un
 * eco del gesto y no una segunda animación que compita con él. Todos
 * terminan exactamente en reposo, así que volver a "idle" no se mueve. */

type Icon = (props: IconProps) => React.ReactElement;
type Gesture = {
  /** Punto sobre el que gira o se aplasta, en % de la caja del icono. */
  origin: string;
  effect: (k: number) => TargetAndTransition;
};

const wiggle = { ease: "easeInOut" } as const;

const GESTURES = new Map<Icon, Gesture>([
  [
    CompassIcon,
    {
      origin: "50% 50%",
      effect: (k) => ({
        rotate: [0, -30 * k, 18 * k, -8 * k, 3 * k, 0],
        transition: { duration: 0.75, ...wiggle },
      }),
    },
  ],
  [
    UsersIcon,
    {
      // Salto con estirón al subir y aplastamiento al caer.
      origin: "50% 100%",
      effect: (k) => ({
        y: [0, -3.5 * k, 0, -0.8 * k, 0],
        scaleX: [1, 1 - 0.06 * k, 1 + 0.08 * k, 1 - 0.01 * k, 1],
        scaleY: [1, 1 + 0.1 * k, 1 - 0.1 * k, 1 + 0.02 * k, 1],
        transition: { duration: 0.6, times: [0, 0.3, 0.6, 0.8, 1], ...wiggle },
      }),
    },
  ],
  [
    MessageIcon,
    {
      // Gira desde el rabito de la burbuja.
      origin: "15% 85%",
      effect: (k) => ({
        rotate: [0, -14 * k, 10 * k, -5 * k, 0],
        scale: [1, 1 + 0.1 * k, 1 + 0.04 * k, 1, 1],
        transition: { duration: 0.6, ...wiggle },
      }),
    },
  ],
  [
    ProfileIcon,
    {
      origin: "50% 100%",
      effect: (k) => ({
        y: [0, 1.5 * k, -2.5 * k, 0],
        scaleY: [1, 1 - 0.1 * k, 1 + 0.05 * k, 1],
        transition: { duration: 0.5, ...wiggle },
      }),
    },
  ],
  [
    KeyIcon,
    {
      // Gira sobre la anilla, como en una cerradura, y vuelve.
      origin: "33% 63%",
      effect: (k) => ({
        rotate: [0, -45 * k, -36 * k, -36 * k, 0],
        transition: { duration: 0.75, times: [0, 0.3, 0.45, 0.65, 1], ...wiggle },
      }),
    },
  ],
  [
    HomeIcon,
    {
      origin: "50% 100%",
      effect: (k) => ({
        y: [0, -2.5 * k, 0, 0],
        scaleY: [1, 1 + 0.1 * k, 1 - 0.07 * k, 1],
        transition: { duration: 0.55, ...wiggle },
      }),
    },
  ],
  [
    SettingsIcon,
    {
      // 90° y 45° son simetrías del engranaje: termina girado pero se ve
      // igual, así que se devuelve a 0 sin animar.
      origin: "50% 50%",
      effect: (k) => ({
        rotate: [0, k >= 1 ? 90 : 45],
        transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
        transitionEnd: { rotate: 0 },
      }),
    },
  ],
]);

const FALLBACK: Gesture = {
  origin: "50% 50%",
  effect: (k) => ({
    scale: [1, 1 + 0.14 * k, 1],
    transition: { duration: 0.3, ease: "easeOut" },
  }),
};

const IDLE = { rotate: 0, scale: 1, scaleX: 1, scaleY: 1, x: 0, y: 0 };

export function navIconMotion(icon: Icon): { origin: string; variants: Variants } {
  const gesture = GESTURES.get(icon) ?? FALLBACK;
  return {
    origin: gesture.origin,
    variants: { idle: IDLE, active: gesture.effect(1), hover: gesture.effect(0.5) },
  };
}
