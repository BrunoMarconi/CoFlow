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
        title="Personas compatibles contigo"
        subtitle="Conoce gente con una forma de vivir, presupuesto y objetivos parecidos a los tuyos."
      />

      <div className="mt-5">
        <PersonasTabs />
      </div>

      <div className="mt-4 flex h-14 items-center gap-1 rounded-full border border-border bg-surface py-1 pl-5 pr-1.5 shadow-soft transition-all duration-180 focus-within:border-primary focus-within:ring-4 focus-within:ring-mint-100">
        <SearchInput
          bare
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          placeholder="Buscar por nombre o ciudad"
        />

        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          aria-label="Filtros"
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors duration-180 sm:px-4 ${
            filtersOpen || isUserFiltersActive(filters)
              ? "bg-mint-100 text-primary-dark"
              : "text-secondary hover:bg-surface-soft"
          }`}
        >
          <FilterIcon />
          <span className="hidden sm:inline">Filtros</span>
        </button>
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

      <section className="mt-8">
        <SectionHeader
          title="Personas"
          subtitle={
            !loading
              ? `${visibleUsers.length} ${
                  visibleUsers.length === 1
                    ? "persona compatible"
                    : "personas compatibles"
                }`
              : undefined
          }
          className="mb-5"
        />

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : (
          <UserGrid users={visibleUsers} />
        )}
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
