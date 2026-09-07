"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  MOTION_CELEBRATION_AUTO_DISMISS_MS,
  MOTION_CELEBRATION_BURST_DISTANCE,
  MOTION_CELEBRATION_BURST_DURATION,
  MOTION_CELEBRATION_SPRING,
  MOTION_CELEBRATION_STAGGER,
  MOTION_DURATION,
  MOTION_EASE,
} from "@/lib/motionTokens";

/* Celebraciones de CoFlow — misma arquitectura que Toast (store
 * imperativo a nivel de módulo + portal, <Celebrations /> montado una
 * sola vez en AppShell), para poder dispararlas desde cualquier sitio,
 * incluso fuera de un componente:
 *
 *   celebrate.match({ me, them, onMessage })
 *
 * Deliberadamente NO bloquea la navegación: quien la dispara sigue
 * haciendo su router.push() al instante si quiere. El overlay vive por
 * encima, se cierra solo y no retiene al usuario en ningún momento. */

type CelebrationPerson = {
  id: string;
  firstName: string;
  lastName?: string | null;
  imageUrl?: string | null;
};

type CelebrationAction = {
  label: string;
  onClick: () => void;
};

type CelebrationItem = {
  id: number;
  title: string;
  message?: string;
  /** Dos personas => coreografía de avatares acercándose. */
  people?: [CelebrationPerson, CelebrationPerson];
  /** Sin personas, se muestra este glifo dentro del disco de marca. */
  glyph?: string;
  action?: CelebrationAction;
};

let current: CelebrationItem | null = null;
let nextId = 1;
let listeners: Array<(item: CelebrationItem | null) => void> = [];

function emit() {
  listeners.forEach((listener) => listener(current));
}

function show(item: Omit<CelebrationItem, "id">) {
  current = { ...item, id: nextId++ };
  emit();
  return current.id;
}

function dismiss() {
  current = null;
  emit();
}

export const celebrate = {
  /** Conexión aceptada: los dos avatares se encuentran. */
  match: (options: {
    me: CelebrationPerson;
    them: CelebrationPerson;
    action?: CelebrationAction;
  }) =>
    show({
      title: "¡Conectados!",
      message: `Ya puedes hablar con ${options.them.firstName}.`,
      people: [options.me, options.them],
      action: options.action,
    }),
  /** Entrar en una comunidad. */
  community: (options: { name: string; action?: CelebrationAction }) =>
    show({
      title: "¡Bienvenido a casa!",
      message: `Ya formas parte de ${options.name}.`,
      glyph: "🏡",
      action: options.action,
    }),
  /** Hito personal (perfil completo, primera reseña...). */
  milestone: (options: {
    title: string;
    message?: string;
    glyph?: string;
    action?: CelebrationAction;
  }) =>
    show({
      title: options.title,
      message: options.message,
      glyph: options.glyph ?? "✨",
      action: options.action,
    }),
  dismiss,
};

/* Ángulos fijos (no aleatorios) para que el destello sea idéntico en
 * cada celebración: se reconoce como "el gesto de CoFlow" en vez de
 * parecer ruido distinto cada vez. */
const BURST_PARTICLES = [
  { angle: -90, scale: 1, delay: 0 },
  { angle: -54, scale: 0.68, delay: 0.04 },
  { angle: -18, scale: 0.86, delay: 0.02 },
  { angle: 18, scale: 0.72, delay: 0.05 },
  { angle: 54, scale: 1, delay: 0.01 },
  { angle: 90, scale: 0.64, delay: 0.06 },
  { angle: 126, scale: 0.9, delay: 0.03 },
  { angle: 162, scale: 0.7, delay: 0.05 },
  { angle: 198, scale: 0.82, delay: 0.02 },
  { angle: 234, scale: 0.66, delay: 0.06 },
  { angle: 270, scale: 0.94, delay: 0 },
  { angle: 306, scale: 0.74, delay: 0.04 },
];

function Burst({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {BURST_PARTICLES.map((particle) => {
        const radians = (particle.angle * Math.PI) / 180;

        return (
          <motion.span
            key={particle.angle}
            initial={{ x: "-50%", y: "-50%", opacity: 0, scale: 0.2 }}
            animate={{
              x: `calc(-50% + ${
                Math.cos(radians) * MOTION_CELEBRATION_BURST_DISTANCE
              }px)`,
              y: `calc(-50% + ${
                Math.sin(radians) * MOTION_CELEBRATION_BURST_DISTANCE
              }px)`,
              opacity: [0, 1, 0],
              scale: particle.scale,
            }}
            transition={{
              duration: MOTION_CELEBRATION_BURST_DURATION,
              delay: 0.12 + particle.delay,
              ease: MOTION_EASE.out,
            }}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-primary"
          />
        );
      })}
    </div>
  );
}

/** Montar una única vez (AppShell). Sin props: lee del store módulo. */
export default function Celebrations() {
  const [item, setItem] = useState<CelebrationItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    listeners.push(setItem);

    return () => {
      listeners = listeners.filter((listener) => listener !== setItem);
    };
  }, []);

  useEffect(() => {
    if (!item) return;

    const timer = setTimeout(dismiss, MOTION_CELEBRATION_AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [item]);

  useEffect(() => {
    if (!item) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item]);

  if (!mounted) return null;

  const animated = !prefersReducedMotion;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
          onClick={dismiss}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-(--z-toast) flex items-center justify-center bg-brand-dark/25 px-6 backdrop-blur-[2px]"
        >
          <motion.div
            initial={
              animated ? { scale: 0.9, y: 12, opacity: 0 } : { opacity: 0 }
            }
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={animated ? { scale: 0.96, opacity: 0 } : { opacity: 0 }}
            transition={
              animated
                ? MOTION_CELEBRATION_SPRING
                : { duration: MOTION_DURATION.fast }
            }
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-sm rounded-24 border border-border bg-surface px-6 py-8 text-center shadow-button"
          >
            <div className="relative mx-auto mb-5 flex h-24 items-center justify-center">
              <Burst enabled={animated} />

              {item.people ? (
                <div className="relative flex items-center justify-center">
                  <motion.div
                    initial={animated ? { x: 46, rotate: -8 } : false}
                    animate={{ x: 12, rotate: -4 }}
                    transition={MOTION_CELEBRATION_SPRING}
                    className="relative z-10"
                  >
                    <UserAvatar
                      firstName={item.people[0].firstName}
                      lastName={item.people[0].lastName}
                      userId={item.people[0].id}
                      imageUrl={item.people[0].imageUrl}
                      size="lg"
                      className="border-2 border-surface"
                    />
                  </motion.div>
                  <motion.div
                    initial={animated ? { x: -46, rotate: 8 } : false}
                    animate={{ x: -12, rotate: 4 }}
                    transition={MOTION_CELEBRATION_SPRING}
                  >
                    <UserAvatar
                      firstName={item.people[1].firstName}
                      lastName={item.people[1].lastName}
                      userId={item.people[1].id}
                      imageUrl={item.people[1].imageUrl}
                      size="lg"
                      className="border-2 border-surface"
                    />
                  </motion.div>
                </div>
              ) : (
                <motion.div
                  initial={animated ? { scale: 0.4 } : false}
                  animate={{ scale: 1 }}
                  transition={MOTION_CELEBRATION_SPRING}
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-surface-soft text-3xl"
                >
                  {item.glyph}
                </motion.div>
              )}
            </div>

            <motion.h2
              initial={animated ? { opacity: 0, y: 8 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: MOTION_CELEBRATION_STAGGER * 2,
                duration: MOTION_DURATION.normal,
                ease: MOTION_EASE.out,
              }}
              className="text-xl font-bold text-foreground"
            >
              {item.title}
            </motion.h2>

            {item.message && (
              <motion.p
                initial={animated ? { opacity: 0, y: 8 } : { opacity: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: MOTION_CELEBRATION_STAGGER * 3,
                  duration: MOTION_DURATION.normal,
                  ease: MOTION_EASE.out,
                }}
                className="mt-2 text-sm font-medium text-secondary"
              >
                {item.message}
              </motion.p>
            )}

            <motion.div
              initial={animated ? { opacity: 0, y: 8 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: MOTION_CELEBRATION_STAGGER * 4,
                duration: MOTION_DURATION.normal,
                ease: MOTION_EASE.out,
              }}
              className="mt-6 flex flex-col gap-2"
            >
              {item.action && (
                <button
                  type="button"
                  data-haptic="medium"
                  onClick={() => {
                    const run = item.action?.onClick;
                    dismiss();
                    run?.();
                  }}
                  className="w-full rounded-control bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
                >
                  {item.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="w-full rounded-control px-5 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-foreground"
              >
                Seguir explorando
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
