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
        <header className="mt-6 flex items-end justify-between gap-6 border-b border-black/[0.07] pb-6 sm:mt-8 sm:pb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#66736c]">Personas · {featuredCity.name}</p>
            <h1 className="mt-2 max-w-2xl text-[34px] font-semibold leading-[1.02] tracking-[-0.05em] text-[#17392c] sm:text-[48px]">Encuentra una forma de convivir que encaje contigo.</h1>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-6 text-[#6b7771] lg:block">Perfiles con hábitos, presupuesto y preferencias visibles antes de conectar.</p>
        </header>

        <div className="sticky top-[calc(var(--safe-top)+.5rem)] z-(--z-sticky-header) -mx-2 mt-4 rounded-[20px] border border-black/[0.06] bg-[#f8faf8]/95 px-3 pb-3 pt-3 shadow-[0_12px_32px_rgba(20,42,32,.07)] backdrop-blur-xl sm:mx-0 sm:px-4">
          <div className="flex h-13 items-center rounded-[14px] bg-white px-4 ring-1 ring-black/[0.06] transition focus-within:ring-2 focus-within:ring-[#315f4b]/25 sm:h-14">
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
                      ? "bg-[#183c2d] text-white"
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
              className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-bold transition-colors duration-200 ${
                filtersOpen || filters.maxBudget || filters.communityStatus !== "ALL"
                  ? "bg-[#183c2d] text-white"
                  : "bg-[#edf1ee] text-[#34463c] hover:bg-[#e4ebe7]"
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

        <div className="mt-7 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-8">
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
            <div className="rounded-[22px] bg-[#183c2d] p-5 text-white shadow-[0_18px_42px_rgba(24,60,45,.14)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-white">
                <ProfileIcon />
              </span>
              <div className="mt-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">
                  Mejora tus resultados
                </h2>
                <span className="text-sm font-semibold text-white/70">{profileCompletion}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/12" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Completa tu perfil para que otras personas entiendan mejor cómo sería convivir contigo.
              </p>
              <Link
                href="/perfil/editar"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[12px] bg-white px-4 text-sm font-semibold text-[#183c2d] transition-colors hover:bg-[#f0f3f1]"
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
