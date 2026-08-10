"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchInput from "@/components/ui/SearchInput";
import { MOTION_DURATION, MOTION_SPRING } from "@/lib/motionTokens";

/** Barra de búsqueda de dos estados (trigger colapsado <-> input
 * expandido con flecha atrás) compartida por Personas y Comunidades.
 * El layoutId es local a cada página — no sobrevive un cambio de
 * ruta real, pero al usar exactamente la misma forma/posición en
 * ambas, el cambio Personas<->Comunidades ya se siente continuo
 * gracias a la transición de página existente (nav-forward/nav-back). */
export default function ExplorerSearchBar({
  layoutIdBar,
  layoutIdIcon,
  searchOpen,
  onOpen,
  onBack,
  value,
  onChange,
  onClear,
  collapsedPlaceholder,
  placeholder,
  rightSlot,
}: {
  layoutIdBar: string;
  layoutIdIcon: string;
  searchOpen: boolean;
  onOpen: () => void;
  onBack: () => void;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  collapsedPlaceholder: string;
  placeholder: string;
  rightSlot?: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!searchOpen ? (
        <motion.div
          key="collapsed"
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast }}
        >
          <motion.button
            type="button"
            layoutId={layoutIdBar}
            onClick={onOpen}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={MOTION_SPRING.gentle}
            className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full border border-border bg-surface pl-5 pr-4 text-left shadow-soft"
          >
            <motion.span layoutId={layoutIdIcon} className="inline-flex shrink-0">
              <SearchIcon />
            </motion.span>

            <span
              className={`truncate text-[15px] ${
                value ? "text-foreground" : "text-muted"
              }`}
            >
              {value || collapsedPlaceholder}
            </span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          className="flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-surface-soft hover:text-brand-dark"
          >
            <ArrowLeftIcon />
          </button>

          <motion.div
            layoutId={layoutIdBar}
            transition={MOTION_SPRING.gentle}
            className="flex h-14 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface pl-5 pr-2 shadow-soft"
          >
            <motion.span layoutId={layoutIdIcon} className="inline-flex shrink-0">
              <SearchIcon />
            </motion.span>

            <SearchInput
              bare
              showIcon={false}
              autoFocus
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onClear={onClear}
              placeholder={placeholder}
            />
          </motion.div>

          {rightSlot}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0 text-muted"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}
