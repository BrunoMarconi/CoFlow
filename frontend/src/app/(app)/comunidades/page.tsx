"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";

import { useCommunities } from "@/hooks/useCommunities";
import { useAuth } from "@/hooks/useAuth";
import CommunityGrid from "@/components/comunidad/CommunityGrid";
import PullToRefresh from "@/components/interaction/PullToRefresh";
import CommunityFilters, {
  JOIN_TYPE_OPTIONS,
  URGENCY_OPTIONS,
  defaultCommunityFilters,
  isCommunityFiltersActive,
  type CommunityFilterState,
} from "@/components/comunidad/CommunityFilters";
import { COMMUNITY_PROFILE_TYPE_LABELS } from "@/lib/communityProfileType";
import DiscoveryToolbar, {
  ChipDivider,
  CityChip,
  QuickChip,
} from "@/components/explorer/DiscoveryToolbar";
import FilterSheet from "@/components/explorer/FilterSheet";
import ActiveFilterChips, {
  type ActiveChip,
} from "@/components/explorer/ActiveFilterChips";
import SectionHeader from "@/components/ui/SectionHeader";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorState from "@/components/ui/ErrorState";
import HomeFab from "@/components/explorer/HomeFab";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { seoCities } from "@/lib/seoCities";

const CITY_FILTER_OPTIONS = seoCities.map((city) => city.name);
const QUICK_PROFILE_FILTERS = ["STUDENTS", "YOUNG_PROFESSIONALS", "MIXED"] as const;

export default function ComunidadesPage() {
  const [search, setSearch] = useState("");
  // "" = todas las ciudades.
  const [cityFilter, setCityFilter] = useState("");
  const [filters, setFilters] = useState<CommunityFilterState>(
    defaultCommunityFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchParams = useSearchParams();
  const justLeft = searchParams.get("left") === "1";

  const { community: myCommunity } = useAuth();

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
    join_type: filters.joinType !== "ALL" ? filters.joinType : undefined,
    urgency: filters.urgency !== "ALL" ? filters.urgency : undefined,
    max_budget: filters.maxBudget ? Number(filters.maxBudget) : undefined,
    move_in_before: filters.moveInBefore || undefined,
    only_with_spots: !filters.showNoSpots,
  });

  // Ciudad, tipo de acceso, urgencia, presupuesto, fecha de entrada y
  // plazas abiertas ya se filtran en el servidor (ver useCommunities
  // arriba) — aquí solo queda el texto libre, que no tiene endpoint de
  // búsqueda por nombre y se aplica sobre la página ya cargada.
  const visibleCommunities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return communities;

    return communities.filter(
      (community) =>
        community.name.toLowerCase().includes(normalizedSearch) ||
        community.city.toLowerCase().includes(normalizedSearch)
    );
  }, [communities, search]);

  const hasQuery = search.trim().length > 0;
  const hasActiveFilters = isCommunityFiltersActive(filters);
  const resultCount = visibleCommunities.length;
  const activeCityLabel = cityFilter || "Málaga";
  const sheetFilterCount = [
    filters.maxBudget !== "",
    filters.moveInBefore !== "",
    filters.joinType !== "ALL",
    filters.urgency !== "ALL",
    filters.profileType !== "ALL",
    filters.showNoSpots,
  ].filter(Boolean).length;

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

    // Los perfiles con atajo en la barra ya se ven marcados allí.
    if (
      filters.profileType !== "ALL" &&
      !(QUICK_PROFILE_FILTERS as readonly string[]).includes(filters.profileType)
    ) {
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

  // El esqueleto y el contenido se funden en vez de reemplazarse de
  // golpe: sin esto, cada carga termina con un salto brusco.
  const resultsState = loading ? "loading" : error ? "error" : "results";

  const resultsBlock = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={resultsState}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} withCover coverClassName="h-32 sm:h-36" />
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
          <PullToRefresh onRefresh={refetch}>
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
          </PullToRefresh>
        )}
      </motion.div>
    </AnimatePresence>
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
    <div className="community-discovery-page -mx-2 min-h-dvh bg-white px-2 sm:-mx-8 sm:px-8 md:mx-0 md:min-h-0 md:bg-transparent md:px-0">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
        className="mt-6 flex items-end justify-between gap-6 border-b border-black/[0.07] pb-6 sm:mt-8 sm:pb-8"
      >
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-[#66736c]">
            Comunidades · {activeCityLabel}
          </p>
          <h1 className="mt-2 max-w-2xl font-rounded text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-dark sm:text-5xl">
            Encuentra un grupo en el que empezar a sentirte en casa.
          </h1>
        </div>
        <p className="hidden max-w-xs text-right text-sm leading-6 text-[#6b7771] lg:block">
          Compara ambiente, presupuesto, plazas disponibles y forma de acceso antes de solicitar unirte.
        </p>
      </motion.header>

      <DiscoveryToolbar
        value={search}
        onChange={setSearch}
        onClear={() => setSearch("")}
        placeholder="Nombre, barrio o ciudad..."
        searchLabel="Buscar comunidades"
        activeFilterCount={sheetFilterCount}
        filtersOpen={filtersOpen}
        onOpenFilters={() => setFiltersOpen(true)}
      >
        <CityChip
          value={cityFilter}
          options={CITY_FILTER_OPTIONS}
          onChange={setCityFilter}
        />
        <ChipDivider />
        {QUICK_PROFILE_FILTERS.map((profileType) => {
          const active = filters.profileType === profileType;

          return (
            <QuickChip
              key={profileType}
              active={active}
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  profileType: active ? "ALL" : profileType,
                }))
              }
            >
              {COMMUNITY_PROFILE_TYPE_LABELS[profileType]}
            </QuickChip>
          );
        })}
      </DiscoveryToolbar>

      {justLeft && (
        <p className="mt-4 rounded-14 border border-primary/30 bg-mint-50 px-5 py-4 text-sm font-semibold text-primary-dark">
          Has abandonado la comunidad correctamente.
        </p>
      )}

      <AnimatePresence initial={false}>
        {activeChips.length > 0 && (
          <motion.div
            key="active-filters"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className="flex flex-wrap items-center gap-x-3"
          >
            <ActiveFilterChips chips={activeChips} />
            <button
              type="button"
              onClick={() => setFilters(defaultCommunityFilters)}
              className="mt-3 min-h-8 text-primary-dark underline underline-offset-2"
            >
              <span className="text-xs font-bold">Quitar filtros</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {filtersOpen && (
          <FilterSheet
            onClose={() => setFiltersOpen(false)}
            canReset={hasActiveFilters}
            onReset={() => setFilters(defaultCommunityFilters)}
            resultCount={resultCount}
            resultNoun={["comunidad afín", "comunidades afines"]}
          >
            <CommunityFilters
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters(defaultCommunityFilters)}
              resultCount={resultCount}
              sheet
            />
          </FilterSheet>
        )}
      </AnimatePresence>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8">
        <section className="min-w-0">
          <SectionHeader
            title={hasQuery || hasActiveFilters ? "Resultados" : "Comunidades recomendadas"}
            subtitle={resultsCounter}
            className="mb-5"
          />

          {resultsBlock}
        </section>

        <aside className="mt-8 space-y-4 lg:sticky lg:top-50 lg:mt-0" aria-label="Información útil">
          {myCommunity ? (
            <Link
              href="/mi-comunidad"
              className="group block rounded-24 border border-primary/20 bg-mint-50 p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-primary/35"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/65">
                    Tu comunidad
                  </p>
                  <h2 className="mt-2 font-rounded text-xl font-semibold text-brand-dark">
                    {myCommunity.name}
                  </h2>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowIcon />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-14 bg-white/80 p-3">
                  <p className="text-lg font-bold text-brand-dark">{myCommunity.member_count}</p>
                  <p className="text-xs font-medium text-secondary">miembros</p>
                </div>
                <div className="rounded-14 bg-white/80 p-3">
                  <p className="text-lg font-bold text-brand-dark">{myCommunity.open_spots}</p>
                  <p className="text-xs font-medium text-secondary">plazas libres</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-24 border border-primary/20 bg-mint-50 p-5 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-white">
                <PeopleIcon />
              </span>
              <h2 className="mt-4 font-rounded text-lg font-semibold text-brand-dark">
                ¿No encuentras tu piso ideal?
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Crea una comunidad y reúne a las personas con las que quieres convivir.
              </p>
              <Link
                href="/crear/comunidad"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-14 bg-brand-dark px-4 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                Crear una comunidad
              </Link>
            </div>
          )}

          <div className="hidden rounded-24 border border-border bg-surface p-5 shadow-soft lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Explorar por ciudad
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {seoCities.slice(0, 4).map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => setCityFilter(city.name)}
                  aria-pressed={cityFilter === city.name}
                  className={`relative min-h-20 overflow-hidden rounded-14 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    cityFilter === city.name ? "ring-2 ring-primary ring-offset-2" : ""
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
            {cityFilter !== "" && (
              <button
                type="button"
                onClick={() => setCityFilter("")}
                className="mt-4 min-h-11 text-sm font-bold text-primary-dark underline decoration-primary/30 underline-offset-4"
              >
                Ver todas las ciudades
              </button>
            )}
          </div>
        </aside>
      </div>

      <CommunityPageFooter />
      <HomeFab />
    </div>
    </MotionConfig>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CommunityPageFooter() {
  return (
    <footer className="mt-16 border-t border-border/80 bg-[#edf4f1] px-5 py-10 sm:rounded-panel sm:px-8">
      <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-mid text-white"><HomeIcon /></span><span className="font-rounded text-sm font-semibold text-brand-dark">CoFlow</span></div>
      <p className="mt-4 max-w-lg text-xs leading-5 text-secondary">Encuentra personas y comunidades en Málaga según presupuesto, hábitos y preferencias de convivencia.</p>
      <div className="mt-7 grid grid-cols-2 gap-7 text-xs sm:grid-cols-3">
        <FooterGroup title="Producto" links={[["Comunidades", "/comunidades"], ["Personas afines", "/usuarios"], ["Crear comunidad", "/crear/comunidad"]]} />
        <FooterGroup title="Propietarios" links={[["Publicar vivienda", "/para-propietarios"], ["Cómo funciona", "/para-propietarios#como-funciona"], ["Contacto", "mailto:soporte@coflowapp.es"]]} />
        <FooterGroup title="Legal" links={[["Privacidad", "/legal/privacidad"], ["Términos", "/legal/terminos"], ["Política de cookies", "/legal/cookies"]]} />
      </div>
      <p className="mt-9 border-t border-black/5 pt-5 text-3xs text-muted">© {new Date().getFullYear()} CoFlow Living Technologies S.L.</p>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><h3 className="font-bold text-brand-dark">{title}</h3><div className="mt-3 space-y-2.5">{links.map(([label, href]) => <Link key={label} href={href} className="block text-secondary">{label}</Link>)}</div></div>;
}

function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><path d="m4 10 8-6 8 6v9H4Z" /><path d="M9 19v-5h6v5" /></svg>; }

