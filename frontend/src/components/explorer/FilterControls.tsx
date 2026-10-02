"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import CountUp from "@/components/ui/CountUp";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";

/* Piezas de los paneles de filtros de Personas y Comunidades. Viven
 * aquí para que los dos paneles hablen el mismo idioma visual: misma
 * tarjeta por sección, mismo slider de presupuesto, mismos chips. */

/* Las secciones entran escalonadas al abrir el panel. El retraso entre
 * ellas es corto a propósito: debe leerse como que la hoja "se rellena",
 * no como seis animaciones que hay que esperar antes de tocar nada. */
const SHEET_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

const SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
  },
};

const BUDGET_MAX = 1500;

/** Contenedor de las secciones: orquesta su entrada escalonada. */
export function FilterSheetBody({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={SHEET_VARIANTS}
      initial="hidden"
      animate="show"
      className="space-y-3.5 px-4 py-4 pb-8 sm:px-5"
    >
      {children}
    </motion.div>
  );
}

export function FilterSection({
  label,
  active = false,
  children,
}: {
  label: string;
  /** Marca la sección que tiene un filtro puesto. */
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={SECTION_VARIANTS}
      className="rounded-panel border border-border bg-surface p-4 shadow-soft"
    >
      <div className="mb-3.5 flex items-center gap-2">
        <h3 className="text-2xs font-bold uppercase tracking-[.12em] text-muted">
          {label}
        </h3>
        {/* Un punto en vez de una etiqueta con el valor: el valor ya está
            justo debajo, y repetirlo llenaba la cabecera de ruido. */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
          transition={MOTION_SPRING.snappy}
          className="h-1.5 w-1.5 rounded-full bg-primary"
        />
      </div>
      {children}
    </motion.section>
  );
}

/** Presupuesto máximo como cifra grande + slider. `value` vacío = sin
 * límite, igual que en el estado de los filtros. */
export function BudgetFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const budget = Number(value) || 0;

  return (
    <>
      {/* La cifra manda sobre la etiqueta: al arrastrar, lo que se
          mira es el número, no el nombre del filtro. */}
      <p className="flex items-baseline gap-1.5">
        {budget > 0 ? (
          <>
            <span className="text-3xl font-bold tracking-[-0.03em] text-brand-dark tabular-nums">
              <CountUp value={budget} durationSeconds={0.35} />
            </span>
            <span className="text-sm font-semibold text-secondary">€ / mes</span>
          </>
        ) : (
          <span className="text-3xl font-bold tracking-[-0.03em] text-muted">
            Sin límite
          </span>
        )}
      </p>

      <BudgetSlider
        value={budget}
        onChange={(next) => onChange(next === 0 ? "" : String(next))}
      />
    </>
  );
}

function BudgetSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const progress = Math.min(value / BUDGET_MAX, 1) * 100;

  return (
    <div className="mt-3">
      <div className="relative h-6">
        {/* Pista y relleno propios: el `accent-color` nativo no permite
            engrosar la barra ni dar tamaño al pomo. El input real queda
            encima, transparente, para conservar teclado y accesibilidad. */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-surface-soft">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={MOTION_SPRING.snappy}
          />
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-primary shadow-raised"
          animate={{ left: `${progress}%` }}
          transition={MOTION_SPRING.snappy}
        />
        <input
          type="range"
          min="0"
          max={BUDGET_MAX}
          step="50"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Presupuesto máximo"
          className="absolute inset-0 w-full cursor-pointer opacity-0"
        />
      </div>

      <div className="mt-2 flex justify-between text-2xs font-semibold text-muted">
        <span>Sin límite</span>
        <span>750 €</span>
        <span>1.500 €</span>
      </div>
    </div>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.94 }}
      transition={MOTION_SPRING.snappy}
      className={`rounded-full border px-3.5 py-2 transition-colors ${
        active
          ? "border-primary bg-primary text-white shadow-soft"
          : "border-border bg-surface-soft text-secondary hover:border-primary/40"
      }`}
    >
      {/* La letra en el span: `button { font: inherit }` (globals.css,
          fuera de capa) anula las utilidades puestas en el botón. */}
      <span className="text-xs font-bold">{children}</span>
    </motion.button>
  );
}
