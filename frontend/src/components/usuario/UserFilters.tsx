"use client";

import {
  BudgetFilter,
  FilterChip,
  FilterSection,
  FilterSheetBody,
} from "@/components/explorer/FilterControls";

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

/** Contenido del panel de filtros de Personas. La ciudad no está aquí:
 * vive en el chip de la barra de búsqueda, siempre a la vista. */
export default function UserFilters({
  filters,
  onChange,
}: {
  filters: UserFilterState;
  onChange: (filters: UserFilterState) => void;
}) {
  function update(patch: Partial<UserFilterState>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <FilterSheetBody>
      <FilterSection label="Presupuesto máximo" active={filters.maxBudget !== ""}>
        <BudgetFilter
          value={filters.maxBudget}
          onChange={(maxBudget) => update({ maxBudget })}
        />
      </FilterSection>

      <FilterSection
        label="Situación de convivencia"
        active={filters.communityStatus !== "ALL"}
      >
        <div className="flex flex-wrap gap-2">
          {COMMUNITY_STATUS_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              active={filters.communityStatus === option.value}
              onClick={() => update({ communityStatus: option.value })}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </FilterSection>
    </FilterSheetBody>
  );
}
