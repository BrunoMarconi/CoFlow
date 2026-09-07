"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

export default function ProfileCompletionRing({
  completion,
  className,
  /* Los colores son props porque el anillo vive en dos fondos opuestos:
   * el claro de la barra superior y la tarjeta verde oscura del perfil. */
  trackClassName = "text-primary/15",
  progressClassName = "text-primary",
  strokeWidth = 2,
  /** Traza el arco al aparecer, en vez de mostrarlo ya dibujado. */
  animated = false,
}: {
  completion: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  strokeWidth?: number;
  animated?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animated && !prefersReducedMotion;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className={cn("pointer-events-none", className)}
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={trackClassName}
      />
      <motion.circle
        cx="20"
        cy="20"
        r="18"
        fill="none"
        pathLength="100"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={cn("origin-center -rotate-90", progressClassName)}
        initial={
          shouldAnimate
            ? { strokeDasharray: "0 100" }
            : { strokeDasharray: `${completion} 100` }
        }
        animate={{ strokeDasharray: `${completion} 100` }}
        transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
      />
    </svg>
  );
}
