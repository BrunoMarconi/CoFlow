"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SearchInput from "@/components/ui/SearchInput";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SEARCH_LIFT_DURATION,
  MOTION_SPRING,
} from "@/lib/motionTokens";

const COLLAPSED_SHADOW = "0 0 0 0 rgba(0,0,0,0)";
const EXPANDED_SHADOW = "0 6px 16px -8px rgba(13,59,42,0.18)";

/** Barra de búsqueda de dos estados (trigger colapsado <-> header
 * expandido) compartida por Personas y Comunidades — el corazón
 * visual de "Search Mode". Misma barra física en todo momento vía
 * layoutId (nunca se sustituye por otra): al pulsarla se "despega"
 * (tap + sombra + z-index) y luego layoutId anima su transformación
 * completa en anchura/posición usando el spring controlado ya
 * existente en CoFlow (MOTION_SPRING.gentle, sin rebote). */
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
            whileTap={{ scale: 0.975 }}
            animate={{ boxShadow: COLLAPSED_SHADOW }}
            transition={{
              layout: MOTION_SPRING.gentle,
              boxShadow: { duration: MOTION_DURATION.fast },
              scale: { duration: MOTION_SEARCH_LIFT_DURATION },
            }}
            className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-surface-soft pl-5 pr-4 text-left"
          >
            <motion.span
              layoutId={layoutIdIcon}
              animate={{ rotate: 0 }}
              transition={{ layout: MOTION_SPRING.gentle }}
              className="inline-flex shrink-0"
            >
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
          className="relative z-10 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast }}
        >
          <motion.button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-surface-soft hover:text-brand-dark"
          >
            <ArrowLeftIcon />
          </motion.button>

          <motion.div
            layoutId={layoutIdBar}
            animate={{ boxShadow: EXPANDED_SHADOW }}
            transition={{
              layout: MOTION_SPRING.gentle,
              boxShadow: { duration: MOTION_DURATION.normal },
            }}
            className="flex h-14 min-w-0 flex-1 items-center gap-2 rounded-full border border-primary/25 bg-surface pl-5 pr-2"
          >
            <motion.span
              layoutId={layoutIdIcon}
              animate={{ rotate: [0, -7, 0] }}
              transition={{
                layout: MOTION_SPRING.gentle,
                rotate: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
              }}
              className="inline-flex shrink-0"
            >
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
