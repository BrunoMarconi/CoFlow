"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";

/* Sello de "hecho" para las acciones que se envían a otra persona:
 * solicitar entrar en una comunidad, invitar a alguien, pedir conexión.
 *
 * Es deliberadamente el escalón intermedio entre el toast y la
 * celebración a pantalla completa (ver Celebration.tsx):
 *
 *  - un toast se lee como "aviso del sistema" y estas acciones cuestan
 *    algo emocionalmente: se manda algo a alguien y se queda uno esperando;
 *  - una celebración con avatares y botones sería excesiva, porque aquí
 *    todavía no ha pasado nada bueno — solo se ha enviado.
 *
 * No tiene fondo ni botones y no captura el puntero: aparece sobre lo que
 * haya, confirma y se va. Nunca hay que cerrarlo. */

type FeedbackItem = {
  id: number;
  message: string;
  hint?: string;
};

const AUTO_DISMISS_MS = 1500;

let current: FeedbackItem | null = null;
let nextId = 1;
let listeners: Array<(item: FeedbackItem | null) => void> = [];

function emit() {
  listeners.forEach((listener) => listener(current));
}

function vibrateSuccess() {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate([10, 35, 14]);
}

/** Confirma una acción enviada. `hint` explica qué pasa ahora. */
export function actionDone(message: string, hint?: string) {
  current = { id: nextId++, message, hint };
  vibrateSuccess();
  emit();
  return current.id;
}

function dismiss() {
  current = null;
  emit();
}

/** Montar una única vez (AppShell). Sin props: lee del store módulo. */
export default function ActionFeedback() {
  const [item, setItem] = useState<FeedbackItem | null>(null);
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

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
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
          transition={{ duration: MOTION_DURATION.fast }}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-0 z-(--z-toast) flex items-center justify-center px-8"
        >
          <motion.div
            initial={animated ? { scale: 0.82, y: 6 } : false}
            animate={{ scale: 1, y: 0 }}
            exit={animated ? { scale: 0.94, opacity: 0 } : { opacity: 0 }}
            transition={animated ? MOTION_SPRING.gentle : { duration: 0.1 }}
            className="flex flex-col items-center gap-3 rounded-panel border border-white/60 bg-white/85 px-7 py-6 shadow-modal backdrop-blur-2xl backdrop-saturate-150"
          >
            <span className="relative flex h-14 w-14 items-center justify-center">
              {/* Onda que sale del disco: da la sensación de que algo ha
                  salido despedido hacia fuera, que es justo lo que acaba
                  de pasar — la solicitud ya va de camino. */}
              {animated && (
                <motion.span
                  aria-hidden
                  initial={{ scale: 0.6, opacity: 0.5 }}
                  animate={{ scale: 1.9, opacity: 0 }}
                  transition={{ duration: 0.8, ease: MOTION_EASE.out, delay: 0.1 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}

              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  {/* El check se traza en vez de aparecer: el gesto de
                      "marcar" es lo que hace que se sienta como un acuse
                      de recibo y no como un icono más. */}
                  <motion.path
                    d="m5 12.5 4.5 4.5L19 7.5"
                    initial={animated ? { pathLength: 0 } : false}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.4,
                      ease: MOTION_EASE.out,
                      delay: animated ? 0.12 : 0,
                    }}
                  />
                </svg>
              </span>
            </span>

            <div className="text-center">
              <p className="text-sm font-bold text-foreground">{item.message}</p>
              {item.hint && (
                <p className="mt-1 max-w-[16rem] text-2xs leading-4 text-muted">
                  {item.hint}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
