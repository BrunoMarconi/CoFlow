"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
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
import ActiveFilterChips, {
  type ActiveChip,
} from "@/components/explorer/ActiveFilterChips";
import SectionHeader from "@/components/ui/SectionHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorState from "@/components/ui/ErrorState";
import HomeFab from "@/components/explorer/HomeFab";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { seoCities } from "@/lib/seoCities";

const SEARCH_BAR_LAYOUT_ID = "community-search-bar";
const SEARCH_ICON_LAYOUT_ID = "community-search-icon";

const CITY_FILTER_OPTIONS = ["Todas", ...seoCities.map((city) => city.name)];
const QUICK_PROFILE_FILTERS = ["STUDENTS", "YOUNG_PROFESSIONALS", "MIXED"] as const;

export default function ComunidadesPage() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [filters, setFilters] = useState<CommunityFilterState>(
    defaultCommunityFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

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
  const showFiltersPanel = filtersOpen;
  const resultCount = visibleCommunities.length;
  const featuredCity =
    seoCities.find((city) => city.name === cityFilter) ?? seoCities[0];

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
    const frame = window.requestAnimationFrame(() => setPortalReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [filtersOpen]);

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
    <div className="community-discovery-page -mx-2 sm:mx-0">
      {!searchOpen && (
        <header className="mb-4 mt-2 flex items-end justify-between gap-4 sm:mt-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Descubre</p>
            <h1 className="mt-2 font-rounded text-[28px] font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">Comunidades</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted">{resultsCounter}</span>
            {!loadingMyCommunity && !myCommunity && <PrimaryButton href="/crear/comunidad" className="hidden shrink-0 sm:inline-flex"><PlusIcon />Crear comunidad</PrimaryButton>}
          </div>
        </header>
      )}
      <AnimatePresence initial={false}>
        {false && (
          <motion.header
            key="discovery-hero"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
            className="relative mt-4 overflow-hidden rounded-24 bg-brand-dark text-white shadow-soft"
          >
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
                Comunidades CoFlow
              </span>
              <h1 className="mt-4 max-w-xl font-rounded text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl">
                Encuentra personas con las que sentirte en casa
              </h1>
              <p className="mt-3 max-w-lg text-sm font-medium leading-6 text-white/78 sm:text-base">
                Conoce cómo vive cada comunidad, qué ambiente busca y si tiene una plaza para ti.
              </p>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <div className="sticky top-[calc(var(--safe-top)+.5rem)] z-(--z-sticky-header) rounded-[18px] bg-background/95 py-2 backdrop-blur-xl">
        <ExplorerSearchBar
          layoutIdBar={SEARCH_BAR_LAYOUT_ID}
          layoutIdIcon={SEARCH_ICON_LAYOUT_ID}
          searchOpen={searchOpen}
          onOpen={() => setSearchOpen(true)}
          onBack={closeSearch}
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          collapsedPlaceholder="Barrio, nombre o estilo de vida..."
          placeholder="Barrio, nombre o estilo de vida..."
          compact
          collapsedRightSlot={<ExplorerFilterToggle compact active={filtersOpen || isCommunityFiltersActive(filters)} onClick={() => { setSearchOpen(true); setFiltersOpen(true); }} />}
          rightSlot={
            (
              <ExplorerFilterToggle
                animateEntrance
                compact
                active={filtersOpen || isCommunityFiltersActive(filters)}
                onClick={() => setFiltersOpen((current) => !current)}
              />
            )
          }
        />

        <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CITY_FILTER_OPTIONS.map((city) => {
            const active = cityFilter === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => setCityFilter(city)}
                aria-pressed={active}
                className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-bold transition-colors duration-200 ${
                  active
                    ? "bg-brand-dark text-white"
                    : "bg-flat text-foreground hover:bg-flat-strong"
                }`}
              >
                {city}
              </button>
            );
          })}
          {QUICK_PROFILE_FILTERS.map((profileType) => {
            const active = filters.profileType === profileType;
            return <button key={profileType} type="button" onClick={() => setFilters((current) => ({ ...current, profileType: active ? "ALL" : profileType }))} aria-pressed={active} className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-xs font-bold transition-colors ${active ? "bg-brand-dark text-white" : "bg-flat text-foreground hover:bg-flat-strong"}`}>{COMMUNITY_PROFILE_TYPE_LABELS[profileType]}</button>;
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
            className="mt-4"
          >
            <header className="hidden items-center justify-between gap-4">
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

            {isCommunityFiltersActive(filters) && (
              <div className="mt-4">
                <ActiveFilterChips chips={activeChips} />
                <button
                  type="button"
                  onClick={() => setFilters(defaultCommunityFilters)}
                  className="mt-1 text-xs font-bold text-primary-dark underline underline-offset-2"
                >
                  Quitar filtros
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {portalReady && createPortal(<AnimatePresence initial={false}>
        {searchOpen && showFiltersPanel && <motion.div key="filters-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .24 }} className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-[3px]" onClick={() => setFiltersOpen(false)}>
          <motion.section
            initial={{ y: "100%", scale: .97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "105%", scale: .98 }}
            transition={{ type: "spring", stiffness: 330, damping: 34, mass: .9 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: .35 }}
            onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 650) setFiltersOpen(false); }}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="community-filter-title"
            className="flex h-dvh max-h-none w-full max-w-none flex-col overflow-hidden border-0 bg-white shadow-[0_-18px_60px_rgba(98,125,112,.18)]"
          >
            <div className="flex justify-center pb-2 pt-[calc(.75rem+var(--safe-top))]"><span className="h-1.5 w-11 rounded-full bg-black/15" /></div>
            <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#eef1f1] px-5 pb-4 pt-1">
              <button type="button" onClick={() => setFilters(defaultCommunityFilters)} className="justify-self-start text-xs font-semibold text-[#727974] transition hover:text-[#161d1d]">Restablecer</button>
              <div className="text-center"><h2 id="community-filter-title" className="font-rounded text-[18px] font-bold tracking-[-.035em] text-[#161d1d]">Filtros de Convivencia</h2><p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-[#476255]"><span className="h-1.5 w-1.5 rounded-full bg-[#476255]" />Algoritmo CoFlow</p></div>
              <button type="button" onClick={() => setFiltersOpen(false)} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-[#eef5f4] text-[#424844] transition hover:bg-[#e2eae9]" aria-label="Cerrar filtros"><CloseIcon /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f4fbfa] pb-2">
              <CommunityFilters filters={filters} onChange={setFilters} onClear={() => setFilters(defaultCommunityFilters)} resultCount={resultCount} sheet />
            </div>
            <div className="border-t border-black/5 bg-white p-4 pb-[calc(1rem+var(--safe-bottom))]">
              <button type="button" onClick={() => setFiltersOpen(false)} className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#627d70] px-5 text-white shadow-[0_12px_40px_rgba(98,125,112,.22)] transition hover:bg-[#4e675b] active:scale-[.985]"><span className="text-[14px] font-bold">Ver {resultCount} {resultCount === 1 ? "comunidad afín" : "comunidades afines"}</span><span className="flex items-center gap-1.5 text-xs font-medium text-[#e6f3f0]">Aplicar filtros <ArrowIcon /></span></button>
            </div>
          </motion.section>
        </motion.div>}
      </AnimatePresence>, document.body)}

      <div className={`mt-5 ${searchOpen ? "" : "lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8"}`}>
        <section className="min-w-0">
          <SectionHeader
            title={searchOpen ? "Resultados" : "Comunidades recomendadas"}
            subtitle={resultsCounter}
            className={searchOpen ? "mb-5" : "sr-only"}
          />

          {resultsBlock}
        </section>

        {!searchOpen && (
          <aside className="mt-8 space-y-4 lg:sticky lg:top-36 lg:mt-0" aria-label="Información útil">
            {myCommunity ? (
              <Link
                href={`/comunidades/${myCommunity.id}`}
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
              {cityFilter !== "Todas" && (
                <button
                  type="button"
                  onClick={() => setCityFilter("Todas")}
                  className="mt-4 min-h-11 text-sm font-bold text-primary-dark underline decoration-primary/30 underline-offset-4"
                >
                  Ver todas las ciudades
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      <CommunityPageFooter />
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
    <footer className="mt-16 border-t border-border/80 bg-[#edf4f1] px-5 py-10 sm:rounded-[28px] sm:px-8">
      <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#315f4b] text-white"><HomeIcon /></span><span className="font-rounded text-sm font-semibold text-brand-dark">CoFlow</span></div>
      <p className="mt-4 max-w-lg text-xs leading-5 text-secondary">Encuentra personas y comunidades en Málaga según presupuesto, hábitos y preferencias de convivencia.</p>
      <div className="mt-7 grid grid-cols-2 gap-7 text-xs sm:grid-cols-3">
        <FooterGroup title="Producto" links={[["Comunidades", "/comunidades"], ["Personas afines", "/usuarios"], ["Crear comunidad", "/crear/comunidad"]]} />
        <FooterGroup title="Propietarios" links={[["Publicar vivienda", "/para-propietarios"], ["Cómo funciona", "/para-propietarios#como-funciona"], ["Contacto", "mailto:soporte@coflowapp.es"]]} />
        <FooterGroup title="Legal" links={[["Privacidad", "/legal/privacidad"], ["Términos", "/legal/terminos"], ["Política de cookies", "/legal/cookies"]]} />
      </div>
      <p className="mt-9 border-t border-black/5 pt-5 text-[10px] text-muted">© {new Date().getFullYear()} CoFlow Living Technologies S.L.</p>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div><h3 className="font-bold text-brand-dark">{title}</h3><div className="mt-3 space-y-2.5">{links.map(([label, href]) => <Link key={label} href={href} className="block text-secondary">{label}</Link>)}</div></div>;
}

function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><path d="m4 10 8-6 8 6v9H4Z" /><path d="M9 19v-5h6v5" /></svg>; }
function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" /></svg>; }
