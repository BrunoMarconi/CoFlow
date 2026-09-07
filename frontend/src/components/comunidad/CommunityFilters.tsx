"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import CountUp from "@/components/ui/CountUp";
import Switch from "@/components/ui/Switch";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import { COMMUNITY_PROFILE_TYPE_OPTIONS } from "@/lib/communityProfileType";
import type {
  CommunityJoinType,
  CommunityProfileType,
  CommunityUrgency,
} from "@/types/community";

export interface CommunityFilterState {
  maxBudget: string;
  joinType: CommunityJoinType | "ALL";
  urgency: CommunityUrgency | "ALL";
  profileType: CommunityProfileType | "ALL";
  moveInBefore: string;
  showNoSpots: boolean;
}

export const defaultCommunityFilters: CommunityFilterState = {
  maxBudget: "",
  joinType: "ALL",
  urgency: "ALL",
  profileType: "ALL",
  moveInBefore: "",
  showNoSpots: false,
};

export function isCommunityFiltersActive(
  filters: CommunityFilterState
): boolean {
  return (
    filters.maxBudget !== "" ||
    filters.joinType !== "ALL" ||
    filters.urgency !== "ALL" ||
    filters.profileType !== "ALL" ||
    filters.moveInBefore !== "" ||
    filters.showNoSpots
  );
}

export const JOIN_TYPE_OPTIONS: { value: CommunityJoinType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "OPEN", label: "Entrada inmediata" },
  { value: "REQUEST", label: "Con solicitud" },
];

export const URGENCY_OPTIONS: { value: CommunityUrgency | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "NORMAL", label: "Sin prisa" },
  { value: "SOON", label: "Próximamente" },
  { value: "URGENT", label: "Urgente" },
];

export default function CommunityFilters({
  filters,
  onChange,
  onClear,
  resultCount,
  sheet = false,
}: {
  filters: CommunityFilterState;
  onChange: (filters: CommunityFilterState) => void;
  onClear: () => void;
  resultCount: number;
  sheet?: boolean;
}) {
  function update(patch: Partial<CommunityFilterState>) {
    onChange({ ...filters, ...patch });
  }

  if (sheet) {
    const budget = Number(filters.maxBudget) || 0;

    return (
      <motion.div
        variants={SHEET_VARIANTS}
        initial="hidden"
        animate="show"
        className="space-y-3.5 px-4 py-4 pb-8 sm:px-5"
      >
        <FilterSection
          label="Rango de alquiler"
          active={filters.maxBudget !== ""}
        >
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
            onChange={(next) =>
              update({ maxBudget: next === 0 ? "" : String(next) })
            }
          />
        </FilterSection>

        <FilterSection
          label="Entrada antes de"
          active={filters.moveInBefore !== ""}
        >
          <input
            type="date"
            value={filters.moveInBefore}
            onChange={(event) => update({ moveInBefore: event.target.value })}
            className="h-12 w-full rounded-field border border-border bg-surface-soft px-4 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/10"
          />
        </FilterSection>

        <FilterSection label="Tipo de acceso" active={filters.joinType !== "ALL"}>
          <div className="grid grid-cols-2 gap-2.5">
            {JOIN_TYPE_OPTIONS.filter((option) => option.value !== "ALL").map(
              (option) => (
                <ChoiceCard
                  key={option.value}
                  active={filters.joinType === option.value}
                  title={option.label}
                  description={
                    option.value === "OPEN"
                      ? "Entrada disponible"
                      : "La comunidad decide"
                  }
                  icon={option.value === "OPEN" ? <DoorIcon /> : <MessageIcon />}
                  onClick={() =>
                    update({
                      joinType:
                        filters.joinType === option.value ? "ALL" : option.value,
                    })
                  }
                />
              )
            )}
          </div>
        </FilterSection>

        <FilterSection
          label="Urgencia de entrada"
          active={filters.urgency !== "ALL"}
        >
          <SegmentedControl
            options={URGENCY_OPTIONS}
            value={filters.urgency}
            onChange={(value) => update({ urgency: value })}
          />
        </FilterSection>

        <FilterSection
          label="Perfil de la comunidad"
          active={filters.profileType !== "ALL"}
        >
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={filters.profileType === "ALL"}
              onClick={() => update({ profileType: "ALL" })}
            >
              Todos
            </FilterChip>
            {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={filters.profileType === option.value}
                onClick={() => update({ profileType: option.value })}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </FilterSection>

        <FilterSection label="Disponibilidad" active={filters.showNoSpots}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-soft text-primary">
                <PeopleIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Incluir comunidades completas
                </p>
                <p className="mt-0.5 text-2xs text-muted">
                  Muestra también comunidades sin plazas
                </p>
              </div>
            </div>
            {/* El switch compartido, no una copia: ya trae el recorrido
                elástico del pomo y el estado accesible. */}
            <Switch
              checked={filters.showNoSpots}
              onChange={() => update({ showNoSpots: !filters.showNoSpots })}
              label="Incluir comunidades completas"
            />
          </div>
        </FilterSection>
      </motion.div>
    );
  }

  return (
    <div className={sheet ? "px-5 py-6" : "rounded-24 bg-flat p-4 sm:p-5"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="filter-max-budget"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Presupuesto máximo
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
              €
            </span>

            <input
              id="filter-max-budget"
              type="number"
              inputMode="numeric"
              min={0}
              value={filters.maxBudget}
              onChange={(event) =>
                update({ maxBudget: event.target.value })
              }
              placeholder="Sin límite"
              className="h-11.5 w-full rounded-14 border border-border bg-surface pl-9 pr-4 text-sm text-foreground outline-none transition-all duration-180 placeholder:text-muted hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="filter-move-in"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Entrada antes de
          </label>

          <input
            id="filter-move-in"
            type="date"
            value={filters.moveInBefore}
            onChange={(event) =>
              update({ moveInBefore: event.target.value })
            }
            className="h-11.5 w-full rounded-14 border border-border bg-surface px-4 text-sm text-foreground outline-none transition-all duration-180 hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">
          Tipo de acceso
        </p>

        <div className="flex flex-wrap gap-2">
          {JOIN_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ joinType: option.value })}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.joinType === option.value
                  ? "bg-brand-dark text-white"
                  : "bg-surface text-muted hover:bg-surface/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">Urgencia</p>

        <div className="flex flex-wrap gap-2">
          {URGENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ urgency: option.value })}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.urgency === option.value
                  ? "bg-brand-dark text-white"
                  : "bg-surface text-muted hover:bg-surface/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">
          Perfil de la comunidad
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update({ profileType: "ALL" })}
            className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
              filters.profileType === "ALL"
                ? "bg-brand-dark text-white"
                : "bg-surface text-muted hover:bg-surface/70"
            }`}
          >
            Todos
          </button>

          {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ profileType: option.value })}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.profileType === option.value
                  ? "bg-brand-dark text-white"
                  : "bg-surface text-muted hover:bg-surface/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-3 rounded-14 bg-surface px-4 text-sm font-semibold text-foreground">
        <input
          type="checkbox"
          checked={filters.showNoSpots}
          onChange={(event) =>
            update({ showNoSpots: event.target.checked })
          }
          className="h-5 w-5 shrink-0 accent-[var(--brand)]"
        />
        Mostrar comunidades sin plazas abiertas
      </label>

      {!sheet && <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onClear}
          className="flex h-12 w-full items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-foreground transition-colors duration-200 hover:bg-surface-soft sm:w-auto"
        >
          Limpiar filtros
        </button>

        <p className="flex h-12 flex-1 items-center justify-center rounded-14 bg-surface-soft text-sm font-bold text-brand-dark sm:justify-start sm:px-4">
          {resultCount}{" "}
          {resultCount === 1
            ? "comunidad encontrada"
            : "comunidades encontradas"}
        </p>
      </div>}
    </div>
  );
}

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

function FilterSection({
  label,
  active = false,
  children,
}: {
  label: string;
  /** Marca la sección que tiene un filtro puesto. */
  active?: boolean;
  children: React.ReactNode;
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

function BudgetSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const max = 1500;
  const progress = Math.min(value / max, 1) * 100;

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
          max={max}
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

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="grid grid-cols-4 gap-1 rounded-field bg-surface-soft p-1">
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className="relative rounded-control px-1 py-2.5 text-2xs font-bold transition-colors"
          >
            {/* La misma píldora que viaja en la barra de navegación: el
                indicador de "esto está seleccionado" se comporta igual en
                toda la app. */}
            {active && (
              <motion.span
                layoutId="community-urgency-pill"
                transition={
                  prefersReducedMotion ? { duration: 0 } : MOTION_SPRING.snappy
                }
                className="absolute inset-0 rounded-control bg-primary shadow-soft"
              />
            )}
            <span
              className={`relative ${active ? "text-white" : "text-secondary"}`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.94 }}
      transition={MOTION_SPRING.snappy}
      className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${
        active
          ? "border-primary bg-primary text-white shadow-soft"
          : "border-border bg-surface-soft text-secondary hover:border-primary/40"
      }`}
    >
      {children}
    </motion.button>
  );
}

function ChoiceCard({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.97 }}
      transition={MOTION_SPRING.snappy}
      className={`relative flex min-h-28 flex-col justify-between rounded-field border-2 p-3.5 text-left transition-colors ${
        active
          ? "border-primary bg-primary/5 shadow-raised"
          : "border-border bg-surface-soft hover:border-primary/30"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted"}>{icon}</span>
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={MOTION_SPRING.snappy}
            className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
          >
            <CheckIcon />
          </motion.span>
        )}
      </AnimatePresence>
      <span>
        <strong className="block text-sm text-foreground">{title}</strong>
        <span className="mt-0.5 block text-2xs text-muted">{description}</span>
      </span>
    </motion.button>
  );
}
function DoorIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M4 21h16M6 21V4h11v17M13 12h.01" /></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-4 3V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4Z" /></svg>; }
function PeopleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg>; }
