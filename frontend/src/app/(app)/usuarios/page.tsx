"use client";

import { useMemo, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import UserGrid from "@/components/usuario/UserGrid";
import PersonPreviewPanel from "@/components/usuario/PersonPreviewPanel";
import UserFilters, {
  defaultUserFilters,
  isUserFiltersActive,
  type UserFilterState,
} from "@/components/usuario/UserFilters";
import SectionHeader from "@/components/ui/SectionHeader";
import SearchInput from "@/components/ui/SearchInput";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(
    defaultUserFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;

  const { users, loading, hasMore, loadingMore, loadMore } = useUsers({
    max_budget: maxBudget,
  });

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
      <div className="sticky top-[calc(var(--safe-top)+4.5rem)] z-(--z-sticky-header) -mx-4 -mt-6 bg-background/85 px-4 pb-3 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-14 min-w-0 flex-1 items-center rounded-full border border-border bg-surface pl-5 pr-1.5 shadow-soft transition-all duration-180 focus-within:border-primary focus-within:ring-4 focus-within:ring-mint-100">
            <SearchInput
              bare
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
              placeholder="Buscar por nombre, zona o intereses..."
            />
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            aria-label="Filtros"
            title="Filtros"
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-soft transition-colors duration-180 ${
              filtersOpen || isUserFiltersActive(filters)
                ? "border-primary/30 bg-mint-100 text-primary-dark"
                : "border-border bg-surface text-secondary hover:bg-surface-soft"
            }`}
          >
            <FilterIcon />
          </button>
        </div>
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

      <header className="mt-6">
        <h1 className="font-rounded text-lg font-semibold text-brand-dark">
          Personas
        </h1>
      </header>

      <section className="mt-8">
        <SectionHeader
          title="Personas recomendadas"
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
          <>
            <UserGrid users={visibleUsers} onOpen={setOpenUserId} />

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <SecondaryButton onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Cargando..." : "Cargar más personas"}
                </SecondaryButton>
              </div>
            )}
          </>
        )}
      </section>

      {openUserId && (
        <PersonPreviewPanel
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
        />
      )}
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
