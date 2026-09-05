"use client";

import { motion } from "framer-motion";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER_TIGHT,
} from "@/lib/motionTokens";

// Los bloques del panel "nacen" de la SearchBar: entran con un
// stagger ajustado y un pequeño delay inicial para que se noten
// desplegándose justo cuando la barra termina su transformación de
// layout, no simultáneamente con ella.
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: MOTION_STAGGER_TIGHT,
      delayChildren: 0.16,
    },
  },
};

const blockVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out },
  },
};

export interface UserFilterState {
  city: string;
  maxBudget: string;
  communityStatus: "ALL" | "HAS_COMMUNITY" | "LOOKING";
}

export const defaultUserFilters: UserFilterState = {
  city: "",
  maxBudget: "",
  communityStatus: "ALL",
};

export function isUserFiltersActive(filters: UserFilterState): boolean {
  return (
    filters.city !== "" ||
    filters.maxBudget !== "" ||
    filters.communityStatus !== "ALL"
  );
}

export const COMMUNITY_STATUS_OPTIONS: {
  value: UserFilterState["communityStatus"];
  label: string;
}[] = [
  { value: "ALL", label: "Todas" },
  { value: "HAS_COMMUNITY", label: "Ya tiene comunidad" },
  { value: "LOOKING", label: "Busca comunidad" },
];

export default function UserFilters({
  filters,
  onChange,
  onClear,
  resultCount,
}: {
  filters: UserFilterState;
  onChange: (filters: UserFilterState) => void;
  onClear: () => void;
  resultCount: number;
}) {
  function update(patch: Partial<UserFilterState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] p-4 shadow-[0_12px_32px_rgba(20,42,32,.05)] sm:p-5"
    >
      <motion.div variants={blockVariants} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="user-filter-city"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Ciudad
          </label>

          <input
            id="user-filter-city"
            value={filters.city}
            onChange={(event) => update({ city: event.target.value })}
            placeholder="Ej. Málaga"
            className="h-12 w-full rounded-[13px] border border-black/[0.08] bg-[#f2f5f3] px-4 text-[15px] text-foreground outline-none transition-all duration-180 placeholder:text-muted hover:border-[#8fa097] focus:border-[#315f4b] focus:bg-white focus:ring-4 focus:ring-[#315f4b]/10"
          />
        </div>

        <div>
          <label
            htmlFor="user-filter-budget"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Presupuesto máximo
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
              €
            </span>

            <input
              id="user-filter-budget"
              type="number"
              inputMode="numeric"
              min={0}
              value={filters.maxBudget}
              onChange={(event) =>
                update({ maxBudget: event.target.value })
              }
              placeholder="Sin límite"
              className="h-12 w-full rounded-[13px] border border-black/[0.08] bg-[#f2f5f3] pl-9 pr-4 text-[15px] text-foreground outline-none transition-all duration-180 placeholder:text-muted hover:border-[#8fa097] focus:border-[#315f4b] focus:bg-white focus:ring-4 focus:ring-[#315f4b]/10"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={blockVariants} className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">
          Situación de convivencia
        </p>

        <div className="flex flex-wrap gap-2">
          {COMMUNITY_STATUS_OPTIONS.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => update({ communityStatus: option.value })}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.communityStatus === option.value
                  ? "bg-[#183c2d] text-white"
                  : "bg-[#edf1ee] text-[#5f6b64] hover:bg-[#e3eae6]"
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={blockVariants} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={onClear}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex h-12 w-full items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-foreground transition-colors duration-200 hover:bg-surface-soft sm:w-auto"
        >
          Limpiar filtros
        </motion.button>

        <p className="flex h-12 flex-1 items-center justify-center rounded-14 bg-surface text-sm font-bold text-brand-dark sm:justify-start sm:px-4">
          {resultCount}{" "}
          {resultCount === 1 ? "persona encontrada" : "personas encontradas"}
        </p>
      </motion.div>
    </motion.div>
  );
}
