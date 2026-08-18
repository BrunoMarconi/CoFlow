"use client";

import { motion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

/** Botón-icono de filtros reutilizado por Personas/Comunidades, tanto
 * en el header expandido de búsqueda (para reabrir el panel sin
 * perder la query) como, con `animateEntrance`, apareciendo solo
 * cuando hay texto escrito. */
export default function ExplorerFilterToggle({
  active,
  onClick,
  animateEntrance = false,
}: {
  active: boolean;
  onClick: () => void;
  animateEntrance?: boolean;
}) {
  const motionProps = animateEntrance
    ? {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      }
    : {};

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      aria-label="Filtros"
      title="Filtros"
      whileTap={{ scale: 0.92 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      {...motionProps}
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
        active
          ? "bg-mint-100 text-primary-dark"
          : "bg-surface-soft text-secondary hover:bg-surface-soft/70"
      }`}
    >
      <FilterIcon />
    </motion.button>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}
