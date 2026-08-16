"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";

import { useCommunities } from "@/hooks/useCommunities";
import { useAuth } from "@/hooks/useAuth";
import CommunityGrid from "@/components/comunidad/CommunityGrid";
import CommunityFilters, {
  JOIN_TYPE_OPTIONS,
  URGENCY_OPTIONS,
  defaultCommunityFilters,
  isCommunityFiltersActive,
  type CommunityFilterState,
} from "@/components/comunidad/CommunityFilters";
import { COMMUNITY_PROFILE_TYPE_LABELS } from "@/lib/communityProfileType";
import ExplorerSearchBar from "@/components/explorer/ExplorerSearchBar";
import ExplorerFilterToggle from "@/components/explorer/ExplorerFilterToggle";
import ActiveFilterChips, {
  type ActiveChip,
} from "@/components/explorer/ActiveFilterChips";
import SectionHeader from "@/components/ui/SectionHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import ErrorState from "@/components/ui/ErrorState";
import HomeFab from "@/components/explorer/HomeFab";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { seoCities } from "@/lib/seoCities";

const SEARCH_BAR_LAYOUT_ID = "community-search-bar";
const SEARCH_ICON_LAYOUT_ID = "community-search-icon";

const CITY_FILTER_OPTIONS = ["Todas", ...seoCities.map((city) => city.name)];

export default function ComunidadesPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [filters, setFilters] = useState<CommunityFilterState>(
    defaultCommunityFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
    city: cityFilter !== "Todas" ? cityFilter : undefined,
    profile_type:
      filters.profileType !== "ALL" ? filters.profileType : undefined,
  });

  const searchedCommunities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return communities;

    return communities.filter(
      (community) =>
        community.name.toLowerCase().includes(normalizedSearch) ||
        community.city.toLowerCase().includes(normalizedSearch)
    );
  }, [communities, search]);

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
      searchedCommunities
        .filter(
          (community) => community.open_spots > 0 && !community.is_full
        )
        .filter(matchesFilters),
    [searchedCommunities, matchesFilters]
  );

  const withoutSpots = useMemo(
    () =>
      searchedCommunities
        .filter(
          (community) => !(community.open_spots > 0 && !community.is_full)
        )
        .filter(matchesFilters),
    [searchedCommunities, matchesFilters]
  );

  const visibleCommunities = useMemo(
    () => (filters.showNoSpots ? [...withSpots, ...withoutSpots] : withSpots),
    [filters.showNoSpots, withSpots, withoutSpots]
  );

  const hasQuery = search.trim().length > 0;
  const showFiltersPanel = !hasQuery || filtersOpen;
  const resultCount = visibleCommunities.length;

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];

    if (filters.maxBudget) {
      chips.push({
        key: "maxBudget",
        label: `Hasta ${filters.maxBudget} €`,
        onRemove: () =>
          setFilters((current) => ({ ...current, maxBudget: "" })),
      });
    }

    if (filters.moveInBefore) {
      chips.push({
        key: "moveInBefore",
        label: `Antes de ${filters.moveInBefore}`,
        onRemove: () =>
          setFilters((current) => ({ ...current, moveInBefore: "" })),
      });
    }

    if (filters.joinType !== "ALL") {
      const option = JOIN_TYPE_OPTIONS.find(
        (item) => item.value === filters.joinType
      );

      if (option) {
        chips.push({
          key: "joinType",
          label: option.label,
          onRemove: () =>
            setFilters((current) => ({ ...current, joinType: "ALL" })),
        });
      }
    }

    if (filters.urgency !== "ALL") {
      const option = URGENCY_OPTIONS.find(
        (item) => item.value === filters.urgency
      );

      if (option) {
        chips.push({
          key: "urgency",
          label: option.label,
          onRemove: () =>
            setFilters((current) => ({ ...current, urgency: "ALL" })),
        });
      }
    }

    if (filters.profileType !== "ALL") {
      chips.push({
        key: "profileType",
        label: COMMUNITY_PROFILE_TYPE_LABELS[filters.profileType],
        onRemove: () =>
          setFilters((current) => ({ ...current, profileType: "ALL" })),
      });
    }

    if (filters.showNoSpots) {
      chips.push({
        key: "showNoSpots",
        label: "Con y sin plazas",
        onRemove: () =>
          setFilters((current) => ({ ...current, showNoSpots: false })),
      });
    }

    return chips;
  }, [filters]);

  function closeSearch() {
    setSearchOpen(false);
  }

  useEffect(() => {
    if (!searchOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (filtersOpen) {
        setFiltersOpen(false);
        return;
      }

      closeSearch();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, filtersOpen]);

  // Mismo bloque de resultados en la vista normal y dentro del modo
  // búsqueda: se reutiliza tal cual, nunca se duplica.
  const resultsBlock = loading ? (
    <div className="flex flex-col gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="skeleton-shimmer flex min-h-36 overflow-hidden rounded-18 border border-border bg-surface shadow-soft"
        >
          <div className="w-28 shrink-0 bg-[#eef0f2] sm:w-36" />
          <div className="flex flex-1 flex-col justify-between gap-3 p-4">
            <div className="space-y-2">
              <div className="h-4 w-2/5 rounded-full bg-[#e7eaed]" />
              <div className="h-3 w-1/3 rounded-full bg-[#e7eaed]" />
              <div className="h-3 w-1/2 rounded-full bg-[#e7eaed]" />
            </div>
            <div className="h-8 w-28 rounded-full bg-[#e7eaed]" />
          </div>
        </div>
      ))}
    </div>
  ) : error ? (
    <ErrorState
      title="No hemos podido cargar las comunidades"
      description={error}
      onRetry={refetch}
      retryLabel="Volver a intentarlo"
    />
  ) : (
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
  );

  const resultsCounter = !loading && !error && (
    <span className="inline-flex">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resultCount}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast }}
        >
          {resultCount}{" "}
          {resultCount === 1 ? "comunidad encontrada" : "comunidades encontradas"}
        </motion.span>
      </AnimatePresence>
    </span>
  );

  return (
    <MotionConfig reducedMotion="user">
    <div>
      <div className="sticky top-[calc(var(--safe-top)+4.5rem)] z-(--z-sticky-header) -mx-5 -mt-4 bg-background/85 px-5 pb-3 pt-2 backdrop-blur-xl sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-8 lg:px-8">
        <ExplorerSearchBar
          layoutIdBar={SEARCH_BAR_LAYOUT_ID}
          layoutIdIcon={SEARCH_ICON_LAYOUT_ID}
          searchOpen={searchOpen}
          onOpen={() => setSearchOpen(true)}
          onBack={closeSearch}
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          collapsedPlaceholder="Buscar comunidades..."
          placeholder="Buscar comunidades..."
          rightSlot={
            hasQuery && (
              <ExplorerFilterToggle
                animateEntrance
                active={filtersOpen || isCommunityFiltersActive(filters)}
                onClick={() => setFiltersOpen((current) => !current)}
              />
            )
          }
        />

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CITY_FILTER_OPTIONS.map((city) => {
            const active = cityFilter === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setCityFilter(city)}
                aria-pressed={active}
                className={`flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-bold transition-colors duration-200 ${
                  active
                    ? "border-brand-dark bg-brand-dark text-white shadow-button"
                    : "border-border bg-surface text-foreground shadow-soft hover:border-primary/30"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>

        {searchOpen && hasQuery && !filtersOpen && (
          <ActiveFilterChips chips={activeChips} />
        )}
      </div>

      <AnimatePresence initial={false}>
        {!searchOpen && (
          <motion.div
            key="header"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className="mt-6"
          >
            <header className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-rounded text-lg font-semibold text-brand-dark">
                  Comunidades
                </h1>
                <p className="mt-0.5 text-xs font-medium text-secondary">
                  Grupos de personas que ya buscan compañero de piso
                </p>
              </div>

              {!loadingMyCommunity && !myCommunity && (
                <PrimaryButton href="/crear/comunidad" className="hidden shrink-0 sm:inline-flex">
                  <PlusIcon />
                  Crear comunidad
                </PrimaryButton>
              )}
            </header>

            {justLeft && (
              <p className="mt-5 rounded-14 border border-primary/30 bg-mint-50 px-5 py-4 text-sm font-semibold text-primary-dark">
                Has abandonado la comunidad correctamente.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {searchOpen && showFiltersPanel && (
          <motion.div
            key="filters-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -6,
              scale: 0.98,
              transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.out },
            }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
            className="mt-4"
          >
            <p className="mb-3 text-sm font-bold text-brand-dark">
              Buscar comunidades
            </p>

            <CommunityFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(defaultCommunityFilters)}
              resultCount={resultCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mt-8">
        <SectionHeader
          title={searchOpen ? "Resultados" : "Comunidades recomendadas"}
          subtitle={resultsCounter}
          className="mb-5"
        />

        {resultsBlock}
      </section>

      <HomeFab />
    </div>
    </MotionConfig>
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
