"use client";

import { useEffect } from "react";
import { MOTION_PRESS } from "@/lib/motionTokens";

/**
 * Respuesta física a cada toque en toda la app: el control se hunde en el
 * pointer-down y rebota levemente al soltar. Igual que HapticFeedback, va
 * por delegación de eventos: cubre los ~360 botones y enlaces de la app
 * (portales y modales incluidos) sin tocar cada uno.
 *
 * Anima la propiedad `scale` con la Web Animations API, no `transform`:
 * así se suma a cualquier translate que ya lleve el elemento (centrados
 * con -translate-x-1/2, hovers que elevan...) en vez de pisarlo, y no
 * depende de que el componente declare transiciones.
 *
 * No se suma a lo que ya tiene pulsación propia:
 * - data-press="off" en el control o en cualquier contenedor.
 * - Clases .press / .press-control / .press-row o utilidades active:scale.
 * - whileTap de framer-motion (se detecta por el scale() que escribe en
 *   línea en el control o en un envoltorio cercano).
 */

const PRESSABLE = 'button, a[href], [role="button"], [role="tab"], summary';
const OWN_PRESS = /(^|\s)(press|press-control|press-row)(\s|$)|active:(scale|translate)/;

type Press = {
  el: HTMLElement;
  pointerId: number;
  x: number;
  y: number;
  timer: number;
  started: boolean;
};

// Escala de reposo de cada control con una animación en marcha: si el
// usuario toca otra vez a mitad de rebote, se parte del valor que se ve
// en pantalla pero se vuelve siempre al de reposo.
const resting = new WeakMap<HTMLElement, number>();
const running = new WeakMap<HTMLElement, Animation>();

function readScale(el: HTMLElement) {
  const value = getComputedStyle(el).scale;
  if (!value || value === "none") return 1;
  return Number.parseFloat(value) || 1;
}

function hasFramerTap(el: HTMLElement) {
  let node: HTMLElement | null = el;
  for (let depth = 0; node && depth < 5; depth++, node = node.parentElement) {
    if (node.style.transform.includes("scale(")) return true;
  }
  return false;
}

function resolvePressable(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const el = target.closest<HTMLElement>(PRESSABLE);
  if (!el) return null;
  if (el.matches(":disabled, [aria-disabled='true']") || el.closest("[data-press='off']")) return null;
  if (OWN_PRESS.test(el.getAttribute("class") ?? "")) return null;

  // `scale` no afecta a cajas en línea (un enlace dentro de un párrafo),
  // y hundir una superficie que ocupa media pantalla se lee como un fallo.
  const display = getComputedStyle(el).display;
  if (display === "inline" || display === "contents") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width * rect.height > window.innerWidth * window.innerHeight * 0.4) return null;

  return el;
}

function depthFor(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const depth = MOTION_PRESS.depthPx / Math.max(rect.width, rect.height, 1);
  return Math.min(MOTION_PRESS.maxDepth, Math.max(MOTION_PRESS.minDepth, depth));
}

function takeOver(el: HTMLElement) {
  const current = readScale(el);
  const base = resting.get(el) ?? current;
  running.get(el)?.cancel();
  resting.set(el, base);
  return { current, base };
}

function settle(el: HTMLElement, animation: Animation) {
  running.set(el, animation);
  animation.finished.then(
    () => {
      if (running.get(el) !== animation) return;
      running.delete(el);
      resting.delete(el);
      animation.cancel();
    },
    () => {},
  );
}

function pressIn(el: HTMLElement) {
  const { current, base } = takeOver(el);
  const animation = el.animate(
    [{ scale: `${current}` }, { scale: `${base * (1 - depthFor(el))}` }],
    { duration: MOTION_PRESS.inDuration, easing: MOTION_PRESS.inEasing, fill: "forwards" },
  );
  running.set(el, animation);
}

/** Vuelta al reposo. `tap` fuerza un hundimiento previo cuando el toque
 * fue tan rápido que el control no llegó a moverse: sin él, un toque
 * seco no dejaría ninguna huella visual. */
function release(el: HTMLElement, tap: boolean) {
  const { current, base } = takeOver(el);
  const pressed = base * (1 - depthFor(el));
  const { easing, duration } = MOTION_PRESS.release;

  const keyframes: Keyframe[] = tap
    ? [
        { scale: `${current}`, easing: MOTION_PRESS.inEasing },
        { scale: `${pressed}`, offset: MOTION_PRESS.inDuration / (MOTION_PRESS.inDuration + duration), easing },
        { scale: `${base}` },
      ]
    : [{ scale: `${current}`, easing }, { scale: `${base}` }];

  settle(el, el.animate(keyframes, { duration: tap ? MOTION_PRESS.inDuration + duration : duration }));
}

export default function PressFeedback() {
  useEffect(() => {
    // Sin soporte de linear() (navegadores de 2022 o antes) la curva de
    // rebote lanzaría un error en cada toque: mejor no animar.
    if (typeof CSS === "undefined" || !CSS.supports("transition-timing-function", "linear(0, 1)")) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let press: Press | null = null;

    const cancel = () => {
      if (!press) return;
      window.clearTimeout(press.timer);
      if (press.started) release(press.el, false);
      press = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0 || reducedMotion.matches) return;
      cancel();

      const el = resolvePressable(event.target);
      if (!el) return;

      const current: Press = {
        el,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        timer: 0,
        started: false,
      };
      // Con ratón, dos fotogramas: el tiempo justo para que un whileTap
      // de framer se delate escribiendo su scale().
      const delay = event.pointerType === "mouse" ? 34 : MOTION_PRESS.touchDelay;
      current.timer = window.setTimeout(() => {
        if (press !== current) return;
        if (hasFramerTap(el)) {
          press = null;
          return;
        }
        current.started = true;
        pressIn(el);
      }, delay);
      press = current;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.pointerId) return;
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > MOTION_PRESS.slop) cancel();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!press || event.pointerId !== press.pointerId) return;
      const { el, started, timer } = press;
      window.clearTimeout(timer);
      press = null;
      if (started) release(el, false);
      else if (!hasFramerTap(el)) release(el, true);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ") || reducedMotion.matches) return;
      const el = resolvePressable(event.target);
      if (el && el === event.target) release(el, true);
    };

    const options = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", onPointerDown, options);
    document.addEventListener("pointermove", onPointerMove, options);
    document.addEventListener("pointerup", onPointerUp, options);
    document.addEventListener("pointercancel", cancel, options);
    document.addEventListener("keydown", onKeyDown, options);
    return () => {
      cancel();
      document.removeEventListener("pointerdown", onPointerDown, options);
      document.removeEventListener("pointermove", onPointerMove, options);
      document.removeEventListener("pointerup", onPointerUp, options);
      document.removeEventListener("pointercancel", cancel, options);
      document.removeEventListener("keydown", onKeyDown, options);
    };
  }, []);

  return null;
}
