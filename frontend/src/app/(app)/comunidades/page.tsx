"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import ExplorerGridMotion from "@/components/explorer/ExplorerGridMotion";
import ActiveFilterChips, {
  type ActiveChip,
} from "@/components/explorer/ActiveFilterChips";
import SectionHeader from "@/components/ui/SectionHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useExplorerTransition } from "@/providers/ExplorerTransitionProvider";
import { consumeArrivingDirection } from "@/lib/explorerTransitionState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

const SEARCH_BAR_LAYOUT_ID = "community-search-bar";
const SEARCH_ICON_LAYOUT_ID = "community-search-icon";

export default function ComunidadesPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CommunityFilterState>(
    defaultCommunityFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // "Las comunidades se abren y revelan a las personas" (y a la
  // inversa) — ver ExplorerTransitionProvider/explorerTransitionState.
  const { leaving } = useExplorerTransition();
  const [arriving] = useState(() => consumeArrivingDirection());
  const isSpreading = leaving === "spread";

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

  const actionHref = myCommunity
    ? `/comunidades/${myCommunity.id}`
    : "/crear/comunidad";

  const actionLabel = myCommunity
    ? "Ver mi comunidad"
    : "Crear comunidad";

  // Mismo bloque de resultados en la vista normal y dentro del modo
  // búsqueda: se reutiliza tal cual, nunca se duplica.
  const resultsBlock = loading ? (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonCard key={index} withCover coverClassName="h-32 sm:h-36" />
      ))}
    </div>
  ) : error ? (
    <div className="rounded-18 border border-red-100 bg-red-50 p-8 text-center">
      <p className="font-bold text-red-700">
        No hemos podido cargar las comunidades
      </p>

      <p className="mt-2 text-sm text-red-600">{error}</p>

      <SecondaryButton onClick={refetch} className="mt-5">
        Volver a intentarlo
      </SecondaryButton>
    </div>
  ) : (
    <>
      <CommunityGrid
        communities={visibleCommunities}
        ownCommunityId={myCommunity?.id}
        arriving={arriving === "group"}
        leaving={isSpreading}
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
      <div className="sticky top-[calc(var(--safe-top)+4.5rem)] z-(--z-sticky-header) -mx-4 -mt-6 bg-background/85 px-4 pb-3 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
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

        {searchOpen && hasQuery && !filtersOpen && (
          <ActiveFilterChips chips={activeChips} />
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!searchOpen ? (
          <motion.div
            key="normal-mode"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
          >
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

            <ExplorerGridMotion arriving={arriving}>
              <section className="mt-8">
                <SectionHeader
                  title="Comunidades recomendadas"
                  subtitle={resultsCounter}
                  className="mb-5"
                />

                {resultsBlock}
              </section>
            </ExplorerGridMotion>
          </motion.div>
        ) : (
          <motion.div
            key="search-mode"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
            className="mt-4"
          >
            <AnimatePresence mode="wait" initial={false}>
              {showFiltersPanel ? (
                <motion.div
                  key="filters-panel"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
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
              ) : (
                <motion.div
                  key="results-panel"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
                >
                  <SectionHeader
                    title="Resultados"
                    subtitle={resultsCounter}
                    className="mb-5"
                  />

                  {resultsBlock}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {!loadingMyCommunity && (
        <Link
          href={actionHref}
          aria-label={actionLabel}
          title={actionLabel}
          className="fixed right-5 bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+1rem)] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-soft transition active:scale-95 sm:hidden"
        >
          <HomeIcon />
        </Link>
      )}
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
