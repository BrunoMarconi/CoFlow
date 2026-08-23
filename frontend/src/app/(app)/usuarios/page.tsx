"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
import {
  computeProfileCompletion,
  getProfileCompletionChecklist,
} from "@/lib/profileCompletion";
import { seoCities } from "@/lib/seoCities";

const CITY_OPTIONS = ["Málaga"];

export default function UsuariosPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(defaultUserFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;
  const { users, loading, hasMore, loadingMore, loadMore } = useUsers({
    max_budget: maxBudget,
    city: filters.city || undefined,
    community_status:
      filters.communityStatus !== "ALL" ? filters.communityStatus : undefined,
  });

  // Ciudad, presupuesto y situación de convivencia ya se filtran en el
  // servidor (ver useUsers arriba) — aquí solo queda el texto libre,
  // que no tiene endpoint de búsqueda y se aplica sobre la página ya
  // cargada.
  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return users;

    return users.filter((user) => {
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

      return (
        fullName.includes(normalizedSearch) ||
        searchableTraits.includes(normalizedSearch)
      );
    });
  }, [users, search]);

  const hasQuery = search.trim().length > 0;
  const hasActiveFilters = isUserFiltersActive(filters);
  const resultCount = visibleUsers.length;
  const profileIncomplete = Boolean(
    currentUser &&
      getProfileCompletionChecklist(currentUser).some((item) => !item.done)
  );
  const profileCompletion = currentUser
    ? computeProfileCompletion(currentUser)
    : 0;
  const featuredCity =
    seoCities.find((city) => city.name === filters.city) ?? seoCities[1];

  function selectCity(city: string) {
    setFilters((current) => ({
      ...current,
      city: current.city === city ? "" : city,
    }));
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-7xl">
        <header className="relative mt-4 overflow-hidden rounded-24 bg-brand-dark text-white shadow-soft">
          <Image
            src={featuredCity.image}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 70vw, 100vw"
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/90 to-brand-dark/20" />
          <div className="relative max-w-2xl px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 backdrop-blur-sm">
              Personas CoFlow
            </span>
            <h1 className="mt-4 max-w-xl font-rounded text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
              Encuentra a alguien con quien compartir mucho más que piso
            </h1>
            <p className="mt-3 max-w-lg text-sm font-medium leading-6 text-white/78 sm:text-base">
              Descubre personas afines por ciudad, presupuesto y forma de convivir.
            </p>
          </div>
        </header>

        <div className="sticky top-[calc(var(--safe-top)+1rem)] z-(--z-sticky-header) mt-4 rounded-2xl border border-border bg-surface/95 px-5 pb-3 pt-4 shadow-soft backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex h-13 items-center rounded-14 bg-flat px-4 transition-colors duration-200 focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/20 sm:h-14">
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
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                    active
                      ? "bg-brand-dark text-white"
                      : "bg-flat text-foreground hover:bg-flat-strong"
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
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                filtersOpen || filters.maxBudget || filters.communityStatus !== "ALL"
                  ? "bg-brand-dark text-white"
                  : "bg-flat text-foreground hover:bg-flat-strong"
              }`}
            >
              <FilterIcon />
              Más filtros
            </button>
          </div>
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

        <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8">
        <section className="min-w-0">
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
                <SkeletonCard key={index} withCover coverClassName="h-40 sm:h-44" />
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

        <aside className="mt-8 space-y-4 lg:sticky lg:top-36 lg:mt-0" aria-label="Mejora tu búsqueda">
          {profileIncomplete && (
            <div className="rounded-24 border border-primary/20 bg-mint-50 p-5 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-white">
                <ProfileIcon />
              </span>
              <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="font-rounded text-lg font-semibold text-brand-dark">
                  Mejora tus resultados
                </h2>
                <span className="text-sm font-bold text-primary-dark">{profileCompletion}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/12" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary">
                Completa tu perfil para que otras personas entiendan mejor cómo sería convivir contigo.
              </p>
              <Link
                href="/perfil/editar"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-14 bg-brand-dark px-4 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Completar perfil
              </Link>
            </div>
          )}

          <div className="rounded-24 border border-border bg-surface p-5 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Explorar por ciudad
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {seoCities.slice(0, 4).map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => selectCity(city.name)}
                  aria-pressed={filters.city === city.name}
                  className={`relative min-h-20 overflow-hidden rounded-14 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    filters.city === city.name ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                >
                  <Image src={city.image} alt="" fill sizes="150px" className="object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
                  <span className="absolute inset-x-0 bottom-0 p-3 text-xs font-bold text-white">
                    {city.name}
                  </span>
                </button>
              ))}
            </div>
            {filters.city && (
              <button
                type="button"
                onClick={() => setFilters((current) => ({ ...current, city: "" }))}
                className="mt-4 min-h-11 text-sm font-bold text-primary-dark underline decoration-primary/30 underline-offset-4"
              >
                Ver todas las ciudades
              </button>
            )}
          </div>
        </aside>
        </div>

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
