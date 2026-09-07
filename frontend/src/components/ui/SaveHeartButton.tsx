"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/** Botón de favorito reutilizable, pensado para colocarse como
 * hermano de un <Link> que envuelve el resto de la tarjeta (no
 * anidado dentro), para no meter un <button> dentro de un <a>. */
export default function SaveHeartButton({
  saved,
  saving,
  onToggle,
  className,
}: {
  saved: boolean;
  saving: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      disabled={saving}
      whileTap={saving ? undefined : { scale: 0.88 }}
      transition={MOTION_SPRING.snappy}
      aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={saved}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-primary shadow-soft disabled:opacity-60",
        className
      )}
    >
      {/* Anillo que se expande solo al guardar: confirma la acción sin
          añadir un toast para algo tan pequeño. */}
      <AnimatePresence>
        {saved && (
          <motion.span
            key="ring"
            aria-hidden
            initial={{ opacity: 0.5, scale: 0.6 }}
            animate={{ opacity: 0, scale: 1.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: MOTION_EASE.out }}
            className="absolute inset-0 rounded-full border-2 border-primary"
          />
        )}
      </AnimatePresence>

      <HeartIcon filled={saved} />
    </motion.button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <motion.svg
      animate={{ scale: filled ? [1, 1.15, 1] : 1 }}
      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" />
    </motion.svg>
  );
}
