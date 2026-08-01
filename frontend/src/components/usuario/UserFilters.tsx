"use client";

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

const COMMUNITY_STATUS_OPTIONS: {
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
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
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
            className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none transition focus:border-brand"
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
              className="h-12 w-full rounded-xl border border-line bg-surface pl-9 pr-4 text-base text-foreground outline-none transition focus:border-brand"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">
          Situación de convivencia
        </p>

        <div className="flex flex-wrap gap-2">
          {COMMUNITY_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ communityStatus: option.value })}
              className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${
                filters.communityStatus === option.value
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-line bg-surface text-muted hover:border-brand/40"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

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
          {resultCount === 1 ? "persona encontrada" : "personas encontradas"}
        </p>
      </div>
    </div>
  );
}
