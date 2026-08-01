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
import Spinner from "@/components/ui/Spinner";

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
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Personas
      </h1>

      <p className="mt-2 max-w-lg text-base leading-7 text-muted">
        Encuentra gente compatible para compartir vivienda.
      </p>

      <div className="mt-6">
        <PersonasTabs />
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface px-4 shadow-sm">
          <SearchIcon />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o ciudad"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
          />
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          className={`flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition ${
            filtersOpen || isUserFiltersActive(filters)
              ? "border-brand bg-brand/10 text-brand-dark"
              : "border-line bg-surface text-foreground hover:bg-surface-soft"
          }`}
        >
          <FilterIcon />
          Filtros
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

      <section className="mt-6">
        <h2 className="text-xl font-bold text-foreground">
          Recomendadas para ti
        </h2>

        {!loading && (
          <p className="mt-1 text-sm text-muted">
            {visibleUsers.length}{" "}
            {visibleUsers.length === 1
              ? "persona compatible"
              : "personas compatibles"}
          </p>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <UserGrid users={visibleUsers} />
          )}
        </div>
      </section>
    </div>
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
