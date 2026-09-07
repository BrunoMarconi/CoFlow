"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_SPRING } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/** Extraído tal cual del toggle que ya existía en RoommateSearchCard —
 * mismo tamaño, mismos colores. El recorrido del pomo lo lleva un spring
 * en vez de una transición CSS lineal: el pomo se estira mientras se
 * mantiene pulsado y asienta con un rebote mínimo, que es lo que hace
 * que un switch se sienta físico. */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Nombre accesible del control (no hay label visible propio). */
  label: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-primary" : "bg-border",
        className
      )}
    >
      <motion.span
        // El pomo mide 24px en una pista de 56px con 4px de margen: el
        // recorrido va de x=4 a x=28.
        animate={{ x: checked ? 28 : 4 }}
        // Se estira desde el lado en el que está apoyado, para que el
        // ensanchado nunca se salga de la pista.
        style={{ originX: checked ? 1 : 0 }}
        whileTap={disabled || prefersReducedMotion ? undefined : { scaleX: 1.2 }}
        transition={prefersReducedMotion ? { duration: 0 } : MOTION_SPRING.snappy}
        className="inline-block h-6 w-6 rounded-full bg-surface shadow-soft"
      />
    </button>
  );
}
