"use client";

import { useEffect } from "react";

type HapticKind = "light" | "medium" | "success" | "warning" | "off";

const PATTERNS: Record<Exclude<HapticKind, "off">, number | number[]> = {
  light: 8,
  medium: 16,
  success: [10, 35, 14],
  warning: [22, 45, 22],
};

function vibrate(kind: HapticKind) {
  if (kind === "off" || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(PATTERNS[kind]);
}

/**
 * Feedback háptico progresivo para la interfaz táctil. Se usa delegación de
 * eventos para cubrir también controles renderizados en portales y modales.
 * Un elemento puede declarar data-haptic="off|light|medium|success|warning".
 */
export default function HapticFeedback() {
  useEffect(() => {
    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;

      const source = event.target;
      if (!(source instanceof Element)) return;

      const control = source.closest<HTMLElement>(
        'button, a[href], [role="button"], [role="switch"], [role="tab"], input[type="checkbox"], input[type="radio"]'
      );
      if (!control || control.matches(":disabled, [aria-disabled='true']")) return;

      const configured = control.dataset.haptic as HapticKind | undefined;
      if (configured === "off") return;

      const isPrimaryAction =
        control.matches('[type="submit"]') ||
        control.getAttribute("role") === "switch" ||
        control.getAttribute("aria-pressed") !== null ||
        control.classList.contains("bg-primary");

      vibrate(configured ?? (isPrimaryAction ? "medium" : "light"));
    };

    document.addEventListener("pointerup", handlePointerUp, { passive: true, capture: true });
    return () => document.removeEventListener("pointerup", handlePointerUp, { capture: true });
  }, []);

  return null;
}

