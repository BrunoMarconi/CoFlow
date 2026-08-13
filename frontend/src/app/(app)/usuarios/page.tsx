"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import UserGrid from "@/components/usuario/UserGrid";
import UserFilters, {
  defaultUserFilters,
  isUserFiltersActive,
  type UserFilterState,
} from "@/components/usuario/UserFilters";
import SearchInput from "@/components/ui/SearchInput";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

const CITY_OPTIONS = ["Málaga", "Madrid", "Valencia"];

export default function UsuariosPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(defaultUserFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;
  const { users, loading, hasMore, loadingMore, loadMore } = useUsers({
    max_budget: maxBudget,
  });

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedCity = filters.city.trim().toLowerCase();

    return users.filter((user) => {
      if (normalizedSearch) {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const searchableTraits = [
          user.occupation,
          user.bio,
          user.preferences?.lifestyle,
          user.preferences?.cleanliness,
          user.community?.city,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (
          !fullName.includes(normalizedSearch) &&
          !searchableTraits.includes(normalizedSearch)
        ) {
          return false;
        }
      }

      if (
        normalizedCity &&
        !user.community?.city.toLowerCase().includes(normalizedCity)
      ) {
        return false;
      }

      if (filters.communityStatus === "HAS_COMMUNITY" && !user.community) {
        return false;
      }

      if (filters.communityStatus === "LOOKING" && user.community) {
        return false;
      }

      return true;
    });
  }, [users, search, filters]);

  const hasQuery = search.trim().length > 0;
  const hasActiveFilters = isUserFiltersActive(filters);
  const resultCount = visibleUsers.length;
  const profileIncomplete = Boolean(
    currentUser &&
      (!currentUser.avatar_url ||
        !currentUser.phone ||
        currentUser.rental_budget === null)
  );

  function selectCity(city: string) {
    setFilters((current) => ({
      ...current,
      city: current.city === city ? "" : city,
    }));
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-7xl">
        <header>
          <h1 className="font-rounded text-3xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
            Personas
          </h1>
          <p className="mt-1 text-sm text-secondary sm:text-base">
            Encuentra personas con las que compartir piso
          </p>
        </header>

        <div className="mt-5 flex h-13 items-center rounded-14 border border-border bg-surface px-4 shadow-soft transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 sm:h-14">
          <SearchInput
            bare
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
            placeholder="Buscar por nombre, ciudad o intereses..."
          />
        </div>

        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CITY_OPTIONS.map((city) => {
            const active = filters.city === city;

            return (
              <button
                key={city}
                type="button"
                onClick={() => selectCity(city)}
                aria-pressed={active}
                className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full border bg-surface px-4 text-sm font-bold shadow-soft transition-colors duration-200 ${
                  active
                    ? "border-primary text-primary-dark"
                    : "border-border text-foreground hover:border-primary/40"
                }`}
              >
                {active && <LocationIcon />}
                {city}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-full border bg-surface px-4 text-sm font-bold shadow-soft transition-colors duration-200 ${
              filtersOpen || filters.maxBudget || filters.communityStatus !== "ALL"
                ? "border-primary text-primary-dark"
                : "border-border text-foreground hover:border-primary/40"
            }`}
          >
            <FilterIcon />
            Más filtros
          </button>
        </div>

        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.99 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
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

        <section className="mt-5">
          {(hasQuery || hasActiveFilters) && (
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">Resultados</h2>
                <p className="text-xs text-secondary">
                  {resultCount} {resultCount === 1 ? "persona compatible" : "personas compatibles"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilters(defaultUserFilters);
                }}
                className="text-xs font-bold text-primary-dark"
              >
                Restablecer
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid auto-rows-max grid-cols-2 items-start gap-3 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : resultCount === 0 ? (
            <EmptyState
              variant="search"
              title="No encontramos personas con esos filtros"
              description="Prueba a cambiar la ciudad, el presupuesto o la situación de convivencia."
              action={
                <SecondaryButton
                  onClick={() => {
                    setSearch("");
                    setFilters(defaultUserFilters);
                  }}
                >
                  Restablecer filtros
                </SecondaryButton>
              }
            />
          ) : (
            <>
              <UserGrid
                users={visibleUsers}
                onOpen={(userId) => router.push(`/personas/${userId}`, { transitionTypes: ["nav-forward"] })}
                showRecommendedHeading={!hasQuery && !hasActiveFilters}
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

        {profileIncomplete && (
          <Link
            href="/perfil/editar"
            className="mt-6 flex items-center gap-3 rounded-18 border border-border bg-surface p-4 shadow-soft transition-transform duration-200 active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">
              <ProfileIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-foreground">
                Completa tu perfil
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-secondary">
                Añade más información sobre ti y encuentra personas más compatibles.
              </span>
            </span>
            <span className="shrink-0 rounded-14 bg-primary px-3 py-2 text-xs font-bold text-white shadow-button">
              Completar
            </span>
          </Link>
        )}

      </div>
    </MotionConfig>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="9" r="2.5" />
      <path d="M8.5 16a3.5 3.5 0 0 1 7 0M8 5h8" />
    </svg>
  );
}
