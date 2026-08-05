"use client";

import { useMemo, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import UserGrid from "@/components/usuario/UserGrid";
import PersonasTabs from "@/components/usuario/PersonasTabs";
import UserFilters, {
  defaultUserFilters,
  isUserFiltersActive,
  type UserFilterState,
} from "@/components/usuario/UserFilters";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeader from "@/components/ui/SectionHeader";
import SearchInput from "@/components/ui/SearchInput";
import SoftButton from "@/components/ui/SoftButton";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(
    defaultUserFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;

  const { users, loading } = useUsers({ max_budget: maxBudget });

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedCity = filters.city.trim().toLowerCase();

    return users.filter((user) => {
      if (normalizedSearch) {
        const fullName =
          `${user.first_name} ${user.last_name}`.toLowerCase();

        const matchesName = fullName.includes(normalizedSearch);
        const matchesCity = user.community?.city
          .toLowerCase()
          .includes(normalizedSearch);

        if (!matchesName && !matchesCity) return false;
      }

      if (
        normalizedCity &&
        !user.community?.city.toLowerCase().includes(normalizedCity)
      ) {
        return false;
      }

      if (
        filters.communityStatus === "HAS_COMMUNITY" &&
        !user.community
      ) {
        return false;
      }

      if (filters.communityStatus === "LOOKING" && user.community) {
        return false;
      }

      return true;
    });
  }, [users, search, filters]);

  return (
    <div>
      <PageHeader
        title="Personas"
        subtitle="Encuentra gente compatible para compartir vivienda."
      />

      <div className="mt-4">
        <PersonasTabs />
      </div>

      <div className="mt-4 flex flex-row gap-2">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          placeholder="Buscar por nombre o ciudad"
          className="flex-1"
        />

        <SoftButton
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          aria-label="Filtros"
          active={filtersOpen || isUserFiltersActive(filters)}
          className="px-4 sm:px-5"
        >
          <FilterIcon />
          <span className="hidden sm:inline">Filtros</span>
        </SoftButton>
      </div>

      {filtersOpen && (
        <div className="mt-4">
          <UserFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(defaultUserFilters)}
            resultCount={visibleUsers.length}
          />
        </div>
      )}

      <section className="mt-6">
        <SectionHeader
          title="Recomendadas para ti"
          subtitle={
            !loading
              ? `${visibleUsers.length} ${
                  visibleUsers.length === 1
                    ? "persona compatible"
                    : "personas compatibles"
                }`
              : undefined
          }
        />

        <div className="mt-4">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : (
            <UserGrid users={visibleUsers} />
          )}
        </div>
      </section>
    </div>
  );
}

function FilterIcon() {
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
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </svg>
  );
}
