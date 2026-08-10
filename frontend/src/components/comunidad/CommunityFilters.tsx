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
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
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
              className="h-12 w-full rounded-xl border border-line bg-surface pl-9 pr-4 text-base text-foreground outline-none transition focus:border-brand"
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
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none transition focus:border-brand"
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
              className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${
                filters.joinType === option.value
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-line bg-surface text-muted hover:border-brand/40"
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
              className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${
                filters.urgency === option.value
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-line bg-surface text-muted hover:border-brand/40"
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
            className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${
              filters.profileType === "ALL"
                ? "border-brand bg-brand/10 text-brand-dark"
                : "border-line bg-surface text-muted hover:border-brand/40"
            }`}
          >
            Todos
          </button>

          {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ profileType: option.value })}
              className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${
                filters.profileType === option.value
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-line bg-surface text-muted hover:border-brand/40"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-line px-4 text-sm font-semibold text-foreground">
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
          className="flex h-12 w-full items-center justify-center rounded-xl border border-line bg-surface text-sm font-bold text-foreground transition hover:bg-surface-soft sm:w-auto"
        >
          Limpiar filtros
        </button>

        <p className="flex h-12 flex-1 items-center justify-center rounded-xl bg-surface-soft text-sm font-bold text-brand-dark sm:justify-start sm:px-4">
          {resultCount}{" "}
          {resultCount === 1
            ? "comunidad encontrada"
            : "comunidades encontradas"}
        </p>
      </div>
    </div>
  );
}
