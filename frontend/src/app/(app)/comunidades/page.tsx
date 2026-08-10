"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCommunities } from "@/hooks/useCommunities";
import { useAuth } from "@/hooks/useAuth";
import CommunityGrid from "@/components/comunidad/CommunityGrid";
import CommunityFilters, {
  defaultCommunityFilters,
  isCommunityFiltersActive,
  type CommunityFilterState,
} from "@/components/comunidad/CommunityFilters";
import SectionHeader from "@/components/ui/SectionHeader";
import SearchInput from "@/components/ui/SearchInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function ComunidadesPage() {
  const [cityInput, setCityInput] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [filters, setFilters] = useState<CommunityFilterState>(
    defaultCommunityFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchParams = useSearchParams();
  const justLeft = searchParams.get("left") === "1";

  const {
    community: myCommunity,
    communityLoading: loadingMyCommunity,
  } = useAuth();

  const {
    communities,
    loading,
    error,
    refetch,
    hasMore,
    loadingMore,
    loadMore,
  } = useCommunities({
    city: cityFilter || undefined,
    profile_type:
      filters.profileType !== "ALL" ? filters.profileType : undefined,
  });

  const matchesFilters = useMemo(() => {
    const maxBudgetValue = filters.maxBudget
      ? Number(filters.maxBudget)
      : null;

    const moveInBeforeValue = filters.moveInBefore
      ? new Date(filters.moveInBefore)
      : null;

    return (community: (typeof communities)[number]) => {
      if (
        filters.joinType !== "ALL" &&
        community.join_type !== filters.joinType
      ) {
        return false;
      }

      if (
        filters.urgency !== "ALL" &&
        community.urgency !== filters.urgency
      ) {
        return false;
      }

      if (
        maxBudgetValue !== null &&
        (community.monthly_rent === null ||
          community.monthly_rent > maxBudgetValue)
      ) {
        return false;
      }

      if (moveInBeforeValue !== null) {
        if (!community.move_in_date) return false;

        const moveIn = new Date(`${community.move_in_date}T00:00:00`);

        if (moveIn > moveInBeforeValue) return false;
      }

      return true;
    };
  }, [filters]);

  const withSpots = useMemo(
    () =>
      communities
        .filter(
          (community) => community.open_spots > 0 && !community.is_full
        )
        .filter(matchesFilters),
    [communities, matchesFilters]
  );

  const withoutSpots = useMemo(
    () =>
      communities
        .filter(
          (community) => !(community.open_spots > 0 && !community.is_full)
        )
        .filter(matchesFilters),
    [communities, matchesFilters]
  );

  const visibleCommunities = useMemo(
    () => (filters.showNoSpots ? [...withSpots, ...withoutSpots] : withSpots),
    [filters.showNoSpots, withSpots, withoutSpots]
  );

  function handleFilterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setCityFilter(cityInput.trim());
  }

  function clearCitySearch() {
    setCityInput("");
    setCityFilter("");
  }

  function clearAllFilters() {
    setFilters(defaultCommunityFilters);
  }

  const actionHref = myCommunity
    ? `/comunidades/${myCommunity.id}`
    : "/crear/comunidad";

  const actionLabel = myCommunity
    ? "Ver mi comunidad"
    : "Crear comunidad";

  return (
    <div>
      <div className="sticky top-[calc(var(--safe-top)+4.5rem)] z-(--z-sticky-header) -mx-4 -mt-6 bg-background/85 px-4 pb-3 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          <form
            onSubmit={handleFilterSubmit}
            className="flex h-14 min-w-0 flex-1 items-center rounded-full border border-border bg-surface pl-5 pr-1.5 shadow-soft transition-all duration-180 focus-within:border-primary focus-within:ring-4 focus-within:ring-mint-100"
          >
            <SearchInput
              bare
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              onClear={clearCitySearch}
              placeholder="Buscar ciudad, barrio o comunidad"
            />
          </form>

          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            aria-label="Filtros"
            title="Filtros"
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-soft transition-colors duration-180 ${
              filtersOpen || isCommunityFiltersActive(filters)
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
          <CommunityFilters
            filters={filters}
            onChange={setFilters}
            onClear={clearAllFilters}
            resultCount={visibleCommunities.length}
          />
        </div>
      )}

      <header className="mt-6 flex items-center justify-between gap-4">
        <h1 className="font-rounded text-lg font-semibold text-brand-dark">
          Comunidades
        </h1>

        {!loadingMyCommunity && (
          <PrimaryButton href={actionHref} className="hidden shrink-0 sm:inline-flex">
            {myCommunity ? <UsersIcon /> : <PlusIcon />}
            {actionLabel}
          </PrimaryButton>
        )}
      </header>

      {justLeft && (
        <p className="mt-5 rounded-14 border border-primary/30 bg-mint-50 px-5 py-4 text-sm font-semibold text-primary-dark">
          Has abandonado la comunidad correctamente.
        </p>
      )}

      <section className="mt-8">
        <SectionHeader
          title={
            cityFilter
              ? `Comunidades en ${cityFilter}`
              : "Comunidades recomendadas"
          }
          className="mb-5"
        />

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} withCover coverClassName="h-32 sm:h-36" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-18 border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">
              No hemos podido cargar las comunidades
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <SecondaryButton onClick={refetch} className="mt-5">
              Volver a intentarlo
            </SecondaryButton>
          </div>
        )}

        {!loading && !error && (
          <>
            <CommunityGrid
              communities={visibleCommunities}
              ownCommunityId={myCommunity?.id}
            />

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <SecondaryButton onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Cargando..." : "Cargar más comunidades"}
                </SecondaryButton>
              </div>
            )}
          </>
        )}
      </section>

      {!loadingMyCommunity && (
        <Link
          href={actionHref}
          aria-label={actionLabel}
          title={actionLabel}
          className="fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-soft transition active:scale-95 sm:hidden"
        >
          <HomeIcon />
        </Link>
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

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M14 14.5a4.5 4.5 0 0 1 7.5 3.5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5.5 w-5.5"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
