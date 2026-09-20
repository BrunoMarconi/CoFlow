"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

// Movimiento compartido por /login y /register. Lo que puede resolverse
// con CSS (entradas, píldoras, medidor) vive en Auth.module.css; aquí
// quedan las dos cosas que necesitan medir o reaccionar en el momento:
// el alto de la tarjeta al cambiar de paso y el zarandeo cuando algo
// falla.

const EASE_OUT = "cubic-bezier(.16, 1, .3, 1)";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * La tarjeta crece o encoge al cambiar de paso en vez de dar un salto.
 * Guarda el alto anterior y anima desde él hasta el nuevo; la primera
 * medición no anima nada (no hay "antes").
 */
export function useHeightSwap(ref: RefObject<HTMLElement | null>, key: unknown) {
  const previous = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const next = el.offsetHeight;
    const from = previous.current;
    previous.current = next;
    if (from === null || from === next || reducedMotion()) return;

    el.style.overflow = "hidden";
    const animation = el.animate(
      { height: [`${from}px`, `${next}px`] },
      { duration: 420, easing: EASE_OUT },
    );
    const done = () => el.style.removeProperty("overflow");
    animation.finished.then(done, done);
  }, [key, ref]);
}

/**
 * Un error no debería aparecer y ya está: la tarjeta se sacude una vez,
 * como un "no" de cabeza. `nonce` cambia con cada error, incluso si el
 * mensaje se repite (dos intentos con la misma contraseña mal).
 */
export function useShake(ref: RefObject<HTMLElement | null>, nonce: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el || nonce === 0 || reducedMotion()) return;

    el.animate(
      { translate: ["0", "-9px", "7px", "-5px", "3px", "0"] },
      { duration: 460, easing: "cubic-bezier(.36, .07, .19, .97)" },
    );
  }, [nonce, ref]);
}

/** 0 a 4. Solo para orientar: la regla real (mínimo 8) la valida el input. */
export function passwordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z0-9]/.test(password)) score++;
  if (/[^\w\s]/.test(password)) score++;
  return Math.min(score, 4);
}

export const PASSWORD_LABELS = ["", "Mejorable", "Aceptable", "Buena", "Fuerte"] as const;
