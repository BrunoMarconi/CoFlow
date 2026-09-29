"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useMobilePageTitle } from "@/hooks/useMobilePageTitle";
import UserGrid from "@/components/usuario/UserGrid";
import PullToRefresh from "@/components/interaction/PullToRefresh";
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
  // El encabezado de esta pantalla es una frase larga, así que la barra
  // adopta el nombre corto de la pestaña en vez del titular.
  useMobilePageTitle("Personas");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilterState>(defaultUserFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : undefined;
  const { users, loading, hasMore, loadingMore, loadMore, refetch } = useUsers({
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
    seoCities.find((city) => city.name === filters.city) ?? seoCities[0];

  function selectCity(city: string) {
    setFilters((current) => ({
      ...current,
      city: current.city === city ? "" : city,
    }));
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mt-4 flex items-end justify-between gap-6 border-b border-black/[0.07] pb-5 sm:mt-6 sm:pb-6">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-[#66736c]">Personas · {featuredCity.name}</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-brand-dark sm:text-4xl">Encuentra una forma de convivir que encaje contigo.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary lg:hidden">Hábitos, presupuesto y preferencias visibles antes de conectar.</p>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-6 text-[#6b7771] lg:block">Hábitos, presupuesto y preferencias visibles antes de conectar.</p>
        </header>

        <div className="sticky top-[calc(var(--safe-top)+.5rem)] z-(--z-sticky-header) -mx-2 mt-4 rounded-card border border-black/[0.06] bg-[#f8faf8]/95 p-2.5 shadow-card backdrop-blur-xl sm:mx-0 sm:p-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="flex h-13 min-w-0 flex-1 items-center rounded-control bg-white px-4 ring-1 ring-black/[0.06] transition focus-within:ring-2 focus-within:ring-brand-mid/25 sm:h-12">
              <SearchInput
                bare
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onClear={() => setSearch("")}
                placeholder="Buscar por nombre, ciudad o intereses..."
              />
            </div>

            <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
            {CITY_OPTIONS.map((city) => {
              const active = filters.city === city;

              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => selectCity(city)}
                  aria-pressed={active}
                  className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                    active
                      ? "bg-brand-dark text-white"
                      : "bg-[#edf1ee] text-[#34463c] hover:bg-[#e4ebe7]"
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
              className={`flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                filtersOpen || filters.maxBudget || filters.communityStatus !== "ALL"
                  ? "bg-brand-dark text-white"
                  : "bg-[#edf1ee] text-[#34463c] hover:bg-[#e4ebe7]"
              }`}
            >
              <FilterIcon />
              Más filtros
            </button>
            </div>
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

        <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-7">
        <section className="min-w-0">
          {/* El esqueleto y el contenido se funden en vez de
              reemplazarse de golpe: sin esto, cada carga termina con un
              salto brusco. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={loading ? "loading" : resultCount === 0 ? "empty" : "results"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            >
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
            <PullToRefresh onRefresh={refetch}>
              <UserGrid
                users={visibleUsers}
                onOpen={(userId) => router.push(`/personas/${userId}`, { transitionTypes: ["nav-forward"] })}
                heading={hasQuery || hasActiveFilters ? "Resultados" : "Personas compatibles contigo"}
              />

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <SecondaryButton onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Cargando..." : "Cargar más personas"}
                  </SecondaryButton>
                </div>
              )}
            </PullToRefresh>
          )}
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className="mt-8 lg:sticky lg:top-28 lg:mt-0" aria-label="Mejora tu búsqueda">
          {profileIncomplete && (
            <div className="rounded-card border border-primary/15 bg-[#f2f7f4] p-4 shadow-soft sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-soft">
                  <ProfileIcon />
                </span>
                <h2 className="min-w-0 flex-1 text-base font-semibold text-brand-dark">
                  Mejora tus resultados
                </h2>
                <span className="text-sm font-bold tabular-nums text-primary-dark">{profileCompletion}%</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-primary/12" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-secondary">
                Completa la información que falta para recibir coincidencias más precisas.
              </p>
              <Link
                href="/perfil/editar"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-control bg-brand-dark px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Completar perfil
              </Link>
            </div>
          )}
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
