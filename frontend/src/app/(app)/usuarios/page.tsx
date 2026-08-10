"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
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
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SPRING,
} from "@/lib/motionTokens";

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

  function closeSearch() {
    setSearchOpen(false);
  }

  useEffect(() => {
    if (!searchOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSearch();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const resultCount = visibleUsers.length;

  // Mismo bloque de resultados en ambos modos (normal y búsqueda): se
  // renderiza en el que esté activo en cada momento, nunca en los
  // dos a la vez, así que no hay grid duplicado ni doble coste.
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
      <UserGrid users={visibleUsers} onOpen={setOpenUserId} />

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
        <AnimatePresence mode="wait" initial={false}>
          {!searchOpen ? (
            <motion.div
              key="collapsed"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION_DURATION.fast }}
            >
              <motion.button
                type="button"
                layoutId={SEARCH_BAR_LAYOUT_ID}
                onClick={() => setSearchOpen(true)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                transition={MOTION_SPRING.gentle}
                className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full border border-border bg-surface pl-5 pr-4 text-left shadow-soft"
              >
                <motion.span layoutId={SEARCH_ICON_LAYOUT_ID} className="inline-flex shrink-0">
                  <SearchIcon />
                </motion.span>
                <span
                  className={`truncate text-[15px] ${
                    search ? "text-foreground" : "text-muted"
                  }`}
                >
                  {search || "Buscar por nombre, zona o intereses..."}
                </span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                aria-expanded={filtersOpen}
                aria-label="Filtros"
                title="Filtros"
                whileTap={{ scale: 0.92 }}
                transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-soft transition-colors duration-200 ${
                  filtersOpen || isUserFiltersActive(filters)
                    ? "border-primary/30 bg-mint-100 text-primary-dark"
                    : "border-border bg-surface text-secondary hover:bg-surface-soft"
                }`}
              >
                <FilterIcon />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION_DURATION.fast }}
            >
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Volver"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-200 hover:bg-surface-soft hover:text-brand-dark"
              >
                <ArrowLeftIcon />
              </button>

              <motion.div
                layoutId={SEARCH_BAR_LAYOUT_ID}
                transition={MOTION_SPRING.gentle}
                className="flex h-14 min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-surface pl-5 pr-2 shadow-soft"
              >
                <motion.span layoutId={SEARCH_ICON_LAYOUT_ID} className="inline-flex shrink-0">
                  <SearchIcon />
                </motion.span>
                <SearchInput
                  bare
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onClear={() => setSearch("")}
                  placeholder="Buscar por nombre, zona o intereses..."
                />
              </motion.div>

              <motion.button
                type="button"
                onClick={() => setFiltersOpen((current) => !current)}
                aria-expanded={filtersOpen}
                aria-label="Filtros"
                title="Filtros"
                whileTap={{ scale: 0.92 }}
                transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border shadow-soft transition-colors duration-200 ${
                  filtersOpen || isUserFiltersActive(filters)
                    ? "border-primary/30 bg-mint-100 text-primary-dark"
                    : "border-border bg-surface text-secondary hover:bg-surface-soft"
                }`}
              >
                <FilterIcon />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!searchOpen ? (
          <motion.div
            key="normal-mode"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
          >
            {filtersOpen && (
              <div className="mt-4">
                <UserFilters
                  filters={filters}
                  onChange={setFilters}
                  onClear={() => setFilters(defaultUserFilters)}
                  resultCount={resultCount}
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
                subtitle={resultsCounter}
                className="mb-5"
              />

              {resultsBlock}
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="search-mode"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
            className="mt-4"
          >
            {filtersOpen && (
              <div className="mb-4">
                <UserFilters
                  filters={filters}
                  onChange={setFilters}
                  onClear={() => setFilters(defaultUserFilters)}
                  resultCount={resultCount}
                />
              </div>
            )}

            <SectionHeader
              title={search ? "Resultados" : "Personas recomendadas"}
              subtitle={resultsCounter}
              className="mb-5"
            />

            {resultsBlock}
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

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}
