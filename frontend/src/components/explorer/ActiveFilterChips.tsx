"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

export type ActiveChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

/** Fila compacta de filtros activos, mostrada bajo la SearchBar
 * mientras hay texto escrito y el panel completo de filtros está
 * oculto — reutilizada por Personas y Comunidades. */
export default function ActiveFilterChips({ chips }: { chips: ActiveChip[] }) {
  return (
    <AnimatePresence>
      {chips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {chips.map((chip) => (
            <motion.button
              key={chip.key}
              type="button"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-mint-50 px-3 py-1.5 text-xs font-bold text-primary-dark"
            >
              {chip.label}
              <CloseIcon />
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}
