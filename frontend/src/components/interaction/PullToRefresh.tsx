"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SPRING,
  rubberband,
} from "@/lib/motionTokens";

/* Pull-to-refresh nativo para las pantallas de listado.
 *
 * Solo se activa con el gesto táctil y con la página ya arriba del todo
 * (scrollY <= 0), así que no compite con SwipeNavigation (horizontal) ni
 * con el scroll normal. En desktop no existe: no hay gesto que lo
 * dispare y el listener ni siquiera llega a engancharse.
 *
 * La resistencia progresiva (cada píxel arrastrado cuenta menos que el
 * anterior) es lo que hace que se sienta elástico en vez de lineal. */

/** Distancia real que hay que arrastrar para disparar el refresco. */
const THRESHOLD_PX = 72;

/* La resistencia era lineal (delta * 0.55) con un tope duro a 110px:
 * cada píxel pesaba igual que el anterior y, al llegar al tope, el
 * indicador se quedaba clavado. Un borde que se congela se lee como
 * "se ha colgado"; uno que sigue cediendo cada vez menos se lee como
 * "te responde, pero por aquí ya no hay más". Ahora se usa la curva de
 * goma: nunca llega a pararse del todo, solo se acerca asintóticamente
 * a DAMPED_LIMIT_PX.
 *
 * Los dos valores están elegidos para que el punto de disparo caiga
 * exactamente donde caía antes (~131px de dedo = 72px de indicador):
 * el gesto no se recalibra, solo deja de tener un muro al final. */

/** Asíntota del recorrido: el indicador se acerca sin alcanzarla. */
const DAMPED_LIMIT_PX = 240;

/** Pendiente inicial de la goma — los primeros píxeles siguen al dedo
 * casi 1:1, y la resistencia entra después. */
const RESISTANCE = 0.785;

export default function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // El gesto vive en refs: se actualiza en cada touchmove y no debe
  // provocar un render por píxel movido.
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);
  const crossedRef = useRef(false);
  const refreshingRef = useRef(false);

  // Las páginas suelen pasar un callback recreado en cada render (el
  // refetch de react-query); leerlo desde una ref evita volver a
  // enganchar los listeners táctiles constantemente.
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (prefersReducedMotion) return;

    function handleTouchStart(event: TouchEvent) {
      if (refreshingRef.current) return;
      if (window.scrollY > 0) return;
      startYRef.current = event.touches[0].clientY;
    }

    function handleTouchMove(event: TouchEvent) {
      if (startYRef.current === null) return;

      const delta = event.touches[0].clientY - startYRef.current;

      // Gesto hacia arriba: es scroll normal, se cancela el pull.
      if (delta <= 0) {
        startYRef.current = null;
        pullRef.current = 0;
        setPull(0);
        return;
      }

      // Sin esto el navegador hace su propio overscroll y el indicador
      // se mueve a saltos.
      if (event.cancelable) event.preventDefault();

      const resisted = rubberband(delta, DAMPED_LIMIT_PX, RESISTANCE);
      pullRef.current = resisted;
      setPull(resisted);

      if (!crossedRef.current && resisted >= THRESHOLD_PX) {
        crossedRef.current = true;
        navigator.vibrate?.(10);
      } else if (crossedRef.current && resisted < THRESHOLD_PX) {
        crossedRef.current = false;
      }
    }

    async function handleTouchEnd() {
      if (startYRef.current === null) return;

      const shouldRefresh = pullRef.current >= THRESHOLD_PX;
      startYRef.current = null;
      crossedRef.current = false;

      if (!shouldRefresh) {
        pullRef.current = 0;
        setPull(0);
        return;
      }

      refreshingRef.current = true;
      setRefreshing(true);
      setPull(THRESHOLD_PX);

      try {
        await onRefreshRef.current();
      } finally {
        refreshingRef.current = false;
        pullRef.current = 0;
        setRefreshing(false);
        setPull(0);
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [prefersReducedMotion]);

  const progress = Math.min(pull / THRESHOLD_PX, 1);
  const armed = progress >= 1;

  return (
    <div className="relative">
      <div
        aria-hidden={!refreshing}
        className="pointer-events-none absolute inset-x-0 top-0 flex justify-center"
        style={{ height: 0 }}
      >
        <motion.div
          animate={{
            y: pull > 0 || refreshing ? Math.max(pull - 34, 8) : -44,
            opacity: pull > 0 || refreshing ? 1 : 0,
            scale: 0.7 + progress * 0.3,
          }}
          transition={
            pull > 0 && !refreshing
              ? { duration: 0 }
              : MOTION_SPRING.snappy
          }
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-button"
        >
          <motion.span
            animate={
              refreshing
                ? { rotate: 360 }
                : { rotate: progress * 270 }
            }
            transition={
              refreshing
                ? { duration: 0.8, ease: "linear", repeat: Infinity }
                : { duration: 0 }
            }
            className="flex h-5 w-5 items-center justify-center"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="text-border"
              />
              <motion.circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="text-primary"
                style={{ rotate: -90, transformOrigin: "center" }}
                animate={{
                  pathLength: refreshing ? 0.3 : Math.max(progress, 0.05),
                }}
                transition={{
                  duration: armed ? MOTION_DURATION.fast : 0,
                  ease: MOTION_EASE.out,
                }}
              />
            </svg>
          </motion.span>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: refreshing ? 44 : pull * 0.4 }}
        transition={
          pull > 0 && !refreshing ? { duration: 0 } : MOTION_SPRING.snappy
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
