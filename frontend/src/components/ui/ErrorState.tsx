"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";
import SecondaryButton from "@/components/ui/SecondaryButton";

/* Un error no se "dibuja" como el estado vacío: entra de una pieza con
 * una sacudida corta. Es la misma gramática que el campo de formulario
 * que falla, así que un fallo se reconoce igual en toda la app. */
const SHAKE_KEYFRAMES = { x: [0, -5, 4, -2, 0] };

/** Hermano de EmptyState para bloques/pantallas que fallaron al
 * cargar — borde sólido (no discontinuo) para que un vacío nunca se
 * confunda con un error, tal como pide el sistema de diseño. */
export default function ErrorState({
  title = "No hemos podido cargar esto",
  description,
  icon,
  action,
  onRetry,
  retryLabel = "Reintentar",
  className,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  /** Slot completo si el CTA por defecto ("Reintentar") no encaja. */
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center rounded-18 border border-border bg-surface p-8 text-center sm:p-12",
        className
      )}
    >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={
          prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, ...SHAKE_KEYFRAMES }
        }
        transition={{ duration: 0.45, ease: MOTION_EASE.out }}
        className="mb-4 flex h-20 w-24 items-center justify-center text-red-500 [&>svg]:h-14 [&>svg]:w-14"
      >
        {icon ?? <AlertIcon />}
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
        className="text-lg font-bold text-foreground"
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
          className="mt-2 max-w-sm text-sm text-secondary"
        >
          {description}
        </motion.p>
      )}

      {(action ?? onRetry) && (
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
          className="mt-5"
        >
          {action ?? (
            <SecondaryButton onClick={onRetry}>{retryLabel}</SecondaryButton>
          )}
        </motion.div>
      )}
    </div>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 42c0-12 10-22 23-22s23 10 23 22" />
      <path d="M18 34c4-4 8-6 14-6s11 2 15 6M25 41c2-2 4-3 7-3s6 1 8 3" />
      <circle cx="32" cy="48" r="2" fill="currentColor" stroke="none" />
      <circle cx="50" cy="18" r="9" fill="white" />
      <path d="M50 14v5M50 23h.1" />
    </svg>
  );
}
