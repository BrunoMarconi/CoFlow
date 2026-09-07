"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/* Punto de "en línea". Antes era un <span> estático repetido en cuatro
 * pantallas; el anillo que late es lo que lo hace leer como presencia
 * real y no como una etiqueta más.
 *
 * Es la única animación en bucle de la app: se permite porque es
 * pequeña, comunica algo que de verdad está vivo (la persona está
 * conectada ahora) y desaparece en cuanto deja de estarlo. */

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
} as const;

export default function OnlineDot({
  size = "sm",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span
      aria-label="En línea"
      className={cn("pointer-events-none absolute", SIZES[size], className)}
    >
      {!prefersReducedMotion && (
        <motion.span
          aria-hidden
          initial={{ opacity: 0.55, scale: 1 }}
          animate={{ opacity: 0, scale: 2.1 }}
          transition={{
            duration: 1.9,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="absolute inset-0 rounded-full bg-emerald-500"
        />
      )}
      <span className="absolute inset-0 rounded-full border-2 border-white bg-emerald-500" />
    </span>
  );
}
