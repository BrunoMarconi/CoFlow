"use client";

import { useMemo, useState } from "react";
import { useUsers } from "@/hooks/useUsers";
import UserGrid from "@/components/usuario/UserGrid";
import PersonPreviewPanel from "@/components/usuario/PersonPreviewPanel";
import PersonasTabs from "@/components/usuario/PersonasTabs";
import UserFilters, {
  defaultUserFilters,
  isUserFiltersActive,
  type UserFilterState,
} from "@/components/usuario/UserFilters";
import SectionHeader from "@/components/ui/SectionHeader";
import SearchInput from "@/components/ui/SearchInput";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import type { UserPublicProfile } from "@/types/userPublic";

type QuickFilter = "all" | "looking" | "petFriendly" | "noSmokers";

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "looking", label: "Buscan piso" },
  { key: "petFriendly", label: "Pet friendly" },
  { key: "noSmokers", label: "No fumadores" },
];

function matchesQuickFilter(user: UserPublicProfile, key: QuickFilter) {
  switch (key) {
    case "looking":
      return user.is_looking_for_roommates && !user.community;
    case "petFriendly":
      return user.preferences?.pets === "Me encantan las mascotas";
    case "noSmokers":
      return user.preferences?.smoking === "No quiero convivir con fumadores";
    case "all":
    default:
      return true;
  }
}

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(
    defaultUserFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;

  const { users, loading, hasMore, loadingMore, loadMore } = useUsers({
    max_budget: maxBudget,
  });

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedCity = filters.city.trim().toLowerCase();

    return users.filter((user) => {
      if (!matchesQuickFilter(user, quickFilter)) return false;

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
  }, [users, search, filters, quickFilter]);

  return (
    <div>
      <header>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          CoFlow · Personas
        </p>

        <h1 className="mt-2 font-serif text-4xl font-medium leading-[1.1] tracking-[-0.01em] text-brand-dark sm:text-[42px]">
          Encuentra a tu compañero
        </h1>

        <p className="mt-3 max-w-lg text-[15px] leading-[1.55] text-secondary sm:text-base">
          Perfiles de personas que buscan piso como tú. Conecta según
          estilo de vida, presupuesto y afinidad.
        </p>
      </header>

      <div className="mt-5">
        <PersonasTabs />
      </div>

      <div className="mt-4 flex h-14 items-center gap-1 rounded-full border border-border bg-surface py-1 pl-5 pr-1.5 shadow-soft transition-all duration-180 focus-within:border-primary focus-within:ring-4 focus-within:ring-mint-100">
        <SearchInput
          bare
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch("")}
          placeholder="Buscar por nombre, zona o intereses..."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          aria-label="Más filtros"
          title="Más filtros"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-180 ${
            filtersOpen || isUserFiltersActive(filters)
              ? "border-primary/30 bg-mint-100 text-primary-dark"
              : "border-border bg-surface text-secondary hover:bg-surface-soft"
          }`}
        >
          <FilterIcon />
        </button>

        {QUICK_FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setQuickFilter(option.key)}
            aria-pressed={quickFilter === option.key}
            className={`flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-bold transition-colors duration-180 ${
              quickFilter === option.key
                ? "bg-brand text-white"
                : "bg-surface-muted text-secondary hover:bg-mint-50 hover:text-primary-dark"
            }`}
          >
            {option.label}
          </button>
        ))}
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
