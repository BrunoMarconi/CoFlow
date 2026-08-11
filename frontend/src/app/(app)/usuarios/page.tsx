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
import HomeFab from "@/components/explorer/HomeFab";
import ActiveFilterChips, {
  type ActiveChip,
} from "@/components/explorer/ActiveFilterChips";
import SectionHeader from "@/components/ui/SectionHeader";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_STAGGER_TIGHT,
} from "@/lib/motionTokens";

const SEARCH_BAR_LAYOUT_ID = "people-search-bar";
const SEARCH_ICON_LAYOUT_ID = "people-search-icon";

// Título "Personas": desaparece por completo al entrar en Search
// Mode (no se queda como fondo, a diferencia de las cards — ver
// UserGrid/recede) para que no distraiga del header de búsqueda.
const titleVariants = {
  hidden: { opacity: 0, y: -12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

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

  const sectionTitle = searchOpen ? "Resultados" : "Personas recomendadas";

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
          collapsedPlaceholder="Buscar por nombre o ciudad..."
          placeholder="Buscar por nombre o ciudad..."
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

      <AnimatePresence initial={false}>
        {!searchOpen && (
          <motion.header
            key="title"
            variants={titleVariants}
            initial="visible"
            animate="visible"
            exit="hidden"
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className="mt-6"
          >
            <h1 className="font-rounded text-lg font-semibold text-brand-dark">
              Personas
            </h1>
          </motion.header>
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
            <UserFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(defaultUserFilters)}
              resultCount={resultCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mt-8">
          <SectionHeader
            title={sectionTitle}
            subtitle={resultsCounter}
            className="mb-5"
          />

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : resultCount === 0 ? (
            <EmptyState
              title="No encontramos personas con esos filtros"
              description="Prueba a cambiar la ciudad, el presupuesto o la situación de convivencia."
              action={
                (hasQuery || isUserFiltersActive(filters)) && (
                  <SecondaryButton
                    onClick={() => {
                      setSearch("");
                      setFilters(defaultUserFilters);
                    }}
                  >
                    Restablecer filtros
                  </SecondaryButton>
                )
              }
            />
          ) : (
            <>
              <UserGrid
                users={visibleUsers}
                onOpen={setOpenUserId}
                staggerChildren={searchOpen ? MOTION_STAGGER_TIGHT : 0.04}
                recede={searchOpen && showFiltersPanel}
                highlightFirst={hasQuery}
              />

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

      <AnimatePresence>
        {openUserId && (
          <PersonPreviewPanel
            key={openUserId}
            userId={openUserId}
            onClose={() => setOpenUserId(null)}
          />
        )}
      </AnimatePresence>

      <HomeFab />
    </div>
    </MotionConfig>
  );
}
