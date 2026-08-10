"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useUsers } from "@/hooks/useUsers";
import UserGrid from "@/components/usuario/UserGrid";
import PersonPreviewPanel from "@/components/usuario/PersonPreviewPanel";
import UserFilters, {
  COMMUNITY_STATUS_OPTIONS,
  defaultUserFilters,
  isUserFiltersActive,
  type UserFilterState,
} from "@/components/usuario/UserFilters";
import ExplorerSearchBar from "@/components/explorer/ExplorerSearchBar";
import ExplorerFilterToggle from "@/components/explorer/ExplorerFilterToggle";
import ActiveFilterChips, {
  type ActiveChip,
} from "@/components/explorer/ActiveFilterChips";
import SectionHeader from "@/components/ui/SectionHeader";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

const SEARCH_BAR_LAYOUT_ID = "people-search-bar";
const SEARCH_ICON_LAYOUT_ID = "people-search-icon";

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(
    defaultUserFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const hasQuery = search.trim().length > 0;
  const showFiltersPanel = !hasQuery || filtersOpen;
  const resultCount = visibleUsers.length;

  const activeChips = useMemo<ActiveChip[]>(() => {
    const chips: ActiveChip[] = [];

    if (filters.city) {
      chips.push({
        key: "city",
        label: filters.city,
        onRemove: () => setFilters((current) => ({ ...current, city: "" })),
      });
    }

    if (filters.maxBudget) {
      chips.push({
        key: "maxBudget",
        label: `Hasta ${filters.maxBudget} €`,
        onRemove: () =>
          setFilters((current) => ({ ...current, maxBudget: "" })),
      });
    }

    if (filters.communityStatus !== "ALL") {
      const option = COMMUNITY_STATUS_OPTIONS.find(
        (item) => item.value === filters.communityStatus
      );

      if (option) {
        chips.push({
          key: "communityStatus",
          label: option.label,
          onRemove: () =>
            setFilters((current) => ({ ...current, communityStatus: "ALL" })),
        });
      }
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

  // Mismo bloque de resultados que la vista normal de Personas: se
  // reutiliza tal cual dentro del modo búsqueda, nunca se duplica.
  const resultsBlock = loading ? (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  ) : resultCount === 0 ? (
    <motion.p
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
      className="rounded-18 border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-muted"
    >
      No encontramos personas con esos filtros.
    </motion.p>
  ) : (
    <>
      <UserGrid
        users={visibleUsers}
        onOpen={setOpenUserId}
        staggerChildren={searchOpen ? 0.025 : 0.04}
      />

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <SecondaryButton onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Cargando..." : "Cargar más personas"}
          </SecondaryButton>
        </div>
      )}
    </>
  );

  const resultsCounter = !loading && (
    <span className="inline-flex">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={resultCount}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast }}
        >
          {resultCount} {resultCount === 1 ? "persona compatible" : "personas compatibles"}
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
          collapsedPlaceholder="Buscar por nombre, zona o intereses..."
          placeholder="Buscar personas..."
          rightSlot={
            hasQuery && (
              <ExplorerFilterToggle
                animateEntrance
                active={filtersOpen || isUserFiltersActive(filters)}
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
            <header className="mt-6">
              <h1 className="font-rounded text-lg font-semibold text-brand-dark">
                Personas
              </h1>
            </header>

            <section className="mt-8">
              <SectionHeader
                title="Personas recomendadas"
                subtitle={resultsCounter}
                className="mb-5"
              />

              {resultsBlock}
            </section>
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
                    Buscar personas
                  </p>

                  <UserFilters
                    filters={filters}
                    onChange={setFilters}
                    onClear={() => setFilters(defaultUserFilters)}
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

      <AnimatePresence>
        {openUserId && (
          <PersonPreviewPanel
            key={openUserId}
            userId={openUserId}
            onClose={() => setOpenUserId(null)}
          />
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
