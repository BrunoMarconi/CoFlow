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

  const visibleCommunities = filters.showNoSpots
    ? [...withSpots, ...withoutSpots]
    : withSpots;

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
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex items-start justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Comunidades
          </h1>

          <p className="mt-2 max-w-lg text-base leading-7 text-muted">
            Encuentra una casa y personas con las que encajes.
          </p>
        </div>

        {!loadingMyCommunity && (
          <Link
            href={actionHref}
            className="hidden shrink-0 items-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark sm:inline-flex"
          >
            {myCommunity ? <UsersIcon /> : <PlusIcon />}
            {actionLabel}
          </Link>
        )}
      </header>

      {justLeft && (
        <p className="mt-5 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
          Has abandonado la comunidad correctamente.
        </p>
      )}

      <form
        onSubmit={handleFilterSubmit}
        className="mt-7 flex flex-col gap-2 sm:flex-row"
      >
        <div className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-surface px-4 shadow-sm">
          <SearchIcon />

          <input
            value={cityInput}
            onChange={(event) => setCityInput(event.target.value)}
            placeholder="Buscar ciudad, barrio o comunidad"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
          />

          {cityInput && (
            <button
              type="button"
              onClick={clearCitySearch}
              aria-label="Borrar búsqueda"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="h-14 flex-1 shrink-0 rounded-2xl bg-brand-dark px-5 text-sm font-bold text-white transition hover:bg-brand-dark/90 active:scale-95 sm:flex-none"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            className={`flex h-14 flex-1 shrink-0 items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-bold transition sm:flex-none ${
              filtersOpen || isCommunityFiltersActive(filters)
                ? "border-brand bg-brand/10 text-brand-dark"
                : "border-line bg-surface text-foreground hover:bg-surface-soft"
            }`}
          >
            <FilterIcon />
            Filtros
          </button>
        </div>
      </form>

      {(cityFilter || activeChips.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {cityFilter && (
            <button
              type="button"
              onClick={clearCitySearch}
              className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100"
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
              className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100"
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

      <section className="mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {cityFilter
              ? `Comunidades en ${cityFilter}`
              : "Comunidades recomendadas"}
          </h2>

          {!loading && !error && (
            <p className="mt-1 text-sm text-muted">
              {visibleCommunities.length}{" "}
              {visibleCommunities.length === 1
                ? "comunidad compatible"
                : "comunidades compatibles"}
            </p>
          )}
        </div>

        {loading && <CommunityGridSkeleton />}

        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
            <p className="font-bold text-red-700">
              No hemos podido cargar las comunidades
            </p>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={refetch}
              className="mt-5 rounded-xl bg-surface px-5 py-3 text-sm font-bold text-red-700 shadow-sm transition hover:shadow-md"
            >
              Volver a intentarlo
            </button>
          </div>
        )}

        {!loading && !error && (
          <CommunityGrid communities={visibleCommunities} />
        )}
      </section>

      {!loadingMyCommunity && (
        <Link
          href={actionHref}
          aria-label={actionLabel}
          className="fixed bottom-24 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-[0_12px_35px_rgba(34,197,94,0.35)] transition active:scale-95 sm:hidden"
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

function CommunityGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-sm"
        >
          <div className="h-28 bg-surface-soft sm:h-32" />

          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-3 w-1/3 rounded-full bg-surface-soft" />
            <div className="h-5 w-2/3 rounded-full bg-surface-soft" />
            <div className="h-3 w-full rounded-full bg-surface-soft" />
            <div className="h-3 w-4/5 rounded-full bg-surface-soft" />
          </div>
        </div>
      ))}
    </div>
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
