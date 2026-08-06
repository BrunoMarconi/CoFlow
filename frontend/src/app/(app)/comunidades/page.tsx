"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCommunities } from "@/hooks/useCommunities";
import { useAuth } from "@/hooks/useAuth";
import { getProfileTypeLabel } from "@/lib/communityProfileType";
import CommunityGrid from "@/components/comunidad/CommunityGrid";
import CommunityFilters, {
  defaultCommunityFilters,
  isCommunityFiltersActive,
  type CommunityFilterState,
} from "@/components/comunidad/CommunityFilters";
import PageHeader from "@/components/ui/PageHeader";
import SectionHeader from "@/components/ui/SectionHeader";
import SearchInput from "@/components/ui/SearchInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import SkeletonCard from "@/components/ui/SkeletonCard";

export default function ComunidadesPage() {
  const [cityInput, setCityInput] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [filters, setFilters] = useState<CommunityFilterState>(
    defaultCommunityFilters
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  } = useCommunities({
    city: cityFilter || undefined,
    profile_type:
      filters.profileType !== "ALL" ? filters.profileType : undefined,
  });

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
      communities
        .filter(
          (community) => community.open_spots > 0 && !community.is_full
        )
        .filter(matchesFilters),
    [communities, matchesFilters]
  );

  const withoutSpots = useMemo(
    () =>
      communities
        .filter(
          (community) => !(community.open_spots > 0 && !community.is_full)
        )
        .filter(matchesFilters),
    [communities, matchesFilters]
  );

  const visibleCommunities = useMemo(
    () => (filters.showNoSpots ? [...withSpots, ...withoutSpots] : withSpots),
    [filters.showNoSpots, withSpots, withoutSpots]
  );

  function handleFilterSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setCityFilter(cityInput.trim());
  }

  function clearCitySearch() {
    setCityInput("");
    setCityFilter("");
  }

  function clearAllFilters() {
    setFilters(defaultCommunityFilters);
  }

  const actionHref = myCommunity
    ? `/comunidades/${myCommunity.id}`
    : "/crear/comunidad";

  const actionLabel = myCommunity
    ? "Ver mi comunidad"
    : "Crear comunidad";

  const activeChips = buildActiveChips(filters, setFilters);

  return (
    <div>
      <PageHeader
        title="Encuentra tu próxima comunidad"
        subtitle="Descubre casas y personas con las que de verdad encajes."
        action={
          !loadingMyCommunity && (
            <PrimaryButton href={actionHref} className="hidden sm:inline-flex">
              {myCommunity ? <UsersIcon /> : <PlusIcon />}
              {actionLabel}
            </PrimaryButton>
          )
        }
      />

      {justLeft && (
        <p className="mt-5 rounded-14 border border-primary/30 bg-mint-50 px-5 py-4 text-sm font-semibold text-primary-dark">
          Has abandonado la comunidad correctamente.
        </p>
      )}

      <form
        onSubmit={handleFilterSubmit}
        className="mt-7 flex h-14 items-center gap-1 rounded-full border border-border bg-surface py-1 pl-5 pr-1.5 shadow-soft transition-all duration-180 focus-within:border-primary focus-within:ring-4 focus-within:ring-mint-100"
      >
        <SearchInput
          bare
          value={cityInput}
          onChange={(event) => setCityInput(event.target.value)}
          onClear={clearCitySearch}
          placeholder="Buscar ciudad, barrio o comunidad"
        />

        <span
          aria-hidden="true"
          className="hidden h-7 w-px shrink-0 bg-border sm:block"
        />

        <button
          type="button"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          className={`flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors duration-180 sm:px-4 ${
            filtersOpen || isCommunityFiltersActive(filters)
              ? "bg-mint-100 text-primary-dark"
              : "text-secondary hover:bg-surface-soft"
          }`}
        >
          <FilterIcon />
          <span className="hidden sm:inline">Filtros</span>
        </button>

        <button
          type="submit"
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white transition-all duration-180 hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          Buscar
        </button>
      </form>

      {(cityFilter || activeChips.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {cityFilter && (
            <button
              type="button"
              onClick={clearCitySearch}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-mint-50 px-4 py-2 text-sm font-bold text-primary-dark transition hover:bg-mint-100"
            >
              {cityFilter}
              <CloseIcon />
            </button>
          )}

          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-mint-50 px-4 py-2 text-sm font-bold text-primary-dark transition hover:bg-mint-100"
            >
              {chip.label}
              <CloseIcon />
            </button>
          ))}
        </div>
      )}

      {filtersOpen && (
        <div className="mt-4">
          <CommunityFilters
            filters={filters}
            onChange={setFilters}
            onClear={clearAllFilters}
            resultCount={visibleCommunities.length}
          />
        </div>
      )}

      <section className="mt-8">
        <SectionHeader
          title={
            cityFilter
              ? `Comunidades en ${cityFilter}`
              : "Comunidades recomendadas"
          }
          subtitle={
            !loading && !error
              ? `${visibleCommunities.length} ${
                  visibleCommunities.length === 1
                    ? "comunidad compatible"
                    : "comunidades compatibles"
                }`
              : undefined
          }
          className="mb-5"
        />

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} withCover coverClassName="h-32 sm:h-36" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-18 border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">
              No hemos podido cargar las comunidades
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <SecondaryButton onClick={refetch} className="mt-5">
              Volver a intentarlo
            </SecondaryButton>
          </div>
        )}

        {!loading && !error && (
          <CommunityGrid
            communities={visibleCommunities}
            ownCommunityId={myCommunity?.id}
          />
        )}
      </section>

      {!loadingMyCommunity && (
        <Link
          href={actionHref}
          aria-label={actionLabel}
          className="fixed bottom-24 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-soft transition active:scale-95 sm:hidden"
        >
          {myCommunity ? <UsersIcon /> : <PlusIcon />}
          {myCommunity ? "Mi comunidad" : "Crear"}
        </Link>
      )}
    </div>
  );
}

function buildActiveChips(
  filters: CommunityFilterState,
  setFilters: (
    updater: (current: CommunityFilterState) => CommunityFilterState
  ) => void
) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.maxBudget) {
    chips.push({
      key: "budget",
      label: `Hasta ${Number(filters.maxBudget).toLocaleString("es-ES")} €`,
      onRemove: () =>
        setFilters((current) => ({ ...current, maxBudget: "" })),
    });
  }

  if (filters.joinType !== "ALL") {
    chips.push({
      key: "joinType",
      label:
        filters.joinType === "OPEN"
          ? "Entrada inmediata"
          : "Con solicitud",
      onRemove: () =>
        setFilters((current) => ({ ...current, joinType: "ALL" })),
    });
  }

  if (filters.urgency !== "ALL") {
    chips.push({
      key: "urgency",
      label:
        filters.urgency === "URGENT"
          ? "Urgente"
          : filters.urgency === "SOON"
            ? "Próximamente"
            : "Sin prisa",
      onRemove: () =>
        setFilters((current) => ({ ...current, urgency: "ALL" })),
    });
  }

  if (filters.profileType !== "ALL") {
    chips.push({
      key: "profileType",
      label: getProfileTypeLabel(filters.profileType),
      onRemove: () =>
        setFilters((current) => ({ ...current, profileType: "ALL" })),
    });
  }

  if (filters.moveInBefore) {
    chips.push({
      key: "moveIn",
      label: `Entrada antes del ${new Date(
        `${filters.moveInBefore}T00:00:00`
      ).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`,
      onRemove: () =>
        setFilters((current) => ({ ...current, moveInBefore: "" })),
    });
  }

  return chips;
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

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}
