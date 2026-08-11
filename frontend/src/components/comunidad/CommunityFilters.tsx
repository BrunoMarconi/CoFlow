"use client";

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
}: {
  filters: CommunityFilterState;
  onChange: (filters: CommunityFilterState) => void;
  onClear: () => void;
  resultCount: number;
}) {
  function update(patch: Partial<CommunityFilterState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-5">
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
              className="h-11.5 w-full rounded-14 border border-border bg-surface pl-9 pr-4 text-[15px] text-foreground outline-none transition-all duration-180 placeholder:text-muted hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-mint-100"
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
            className="h-11.5 w-full rounded-14 border border-border bg-surface px-4 text-[15px] text-foreground outline-none transition-all duration-180 hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-mint-100"
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
              className={`min-h-11 rounded-14 border px-4 text-sm font-bold transition-colors duration-200 ${
                filters.joinType === option.value
                  ? "border-primary/30 bg-mint-100 text-primary-dark"
                  : "border-border bg-surface text-muted hover:border-primary/30"
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
              className={`min-h-11 rounded-14 border px-4 text-sm font-bold transition-colors duration-200 ${
                filters.urgency === option.value
                  ? "border-primary/30 bg-mint-100 text-primary-dark"
                  : "border-border bg-surface text-muted hover:border-primary/30"
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
            className={`min-h-11 rounded-14 border px-4 text-sm font-bold transition-colors duration-200 ${
              filters.profileType === "ALL"
                ? "border-primary/30 bg-mint-100 text-primary-dark"
                : "border-border bg-surface text-muted hover:border-primary/30"
            }`}
          >
            Todos
          </button>

          {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ profileType: option.value })}
              className={`min-h-11 rounded-14 border px-4 text-sm font-bold transition-colors duration-200 ${
                filters.profileType === option.value
                  ? "border-primary/30 bg-mint-100 text-primary-dark"
                  : "border-border bg-surface text-muted hover:border-primary/30"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-3 rounded-14 border border-border px-4 text-sm font-semibold text-foreground">
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
      </div>
    </div>
  );
}
