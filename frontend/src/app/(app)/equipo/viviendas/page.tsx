"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bath, BedDouble, Building2, CircleAlert, CircleCheck, ImagePlus, LoaderCircle, MapPin, Plus, Search, UserRound, Users } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Input from "@/components/ui/Input";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { getTeamProperties } from "@/services/team";
import { TEAM_STATUS_LABELS, formatEuros, formatRelative, normalizeSearch } from "@/lib/teamListing";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/property";
import type { TeamPropertySummary } from "@/types/team";

type StatusFilter = PropertyStatus | "ALL";

const STATUS_ORDER: PropertyStatus[] = ["DRAFT", "READY", "PAUSED", "PUBLISHED", "RENTED", "ARCHIVED"];

const STATUS_DOT: Record<PropertyStatus, string> = {
  DRAFT: "bg-amber-500",
  READY: "bg-primary",
  PAUSED: "bg-neutral-mid",
  PUBLISHED: "bg-primary",
  RENTED: "bg-blue-600",
  ARCHIVED: "bg-muted",
};

export default function TeamPropertiesPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="cards" />}>
      <TeamPropertiesPanel />
    </Suspense>
  );
}

function matchesQuery(property: TeamPropertySummary, query: string) {
  if (!query) return true;
  const haystack = normalizeSearch(
    [
      property.title,
      property.address_line,
      property.neighborhood,
      property.postal_code,
      property.owner.display_name,
      property.owner.company_name,
      property.owner.first_name,
      property.owner.last_name,
      property.owner.email,
      property.owner.phone,
    ]
      .filter(Boolean)
      .join(" ")
  );
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

function TeamPropertiesPanel() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("cliente") ?? "ALL");

  const { data = [], isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["team-properties"],
    queryFn: () => getTeamProperties(),
    staleTime: 15_000,
  });

  const owners = useMemo(() => {
    const byId = new Map<number, { id: number; name: string; count: number }>();
    for (const property of data) {
      const current = byId.get(property.owner.owner_profile_id);
      byId.set(property.owner.owner_profile_id, {
        id: property.owner.owner_profile_id,
        name: property.owner.display_name,
        count: (current?.count ?? 0) + 1,
      });
    }
    return [...byId.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));
  }, [data]);

  const normalizedQuery = normalizeSearch(query);
  const scoped = data.filter(
    (property) =>
      (ownerFilter === "ALL" || String(property.owner.owner_profile_id) === ownerFilter) &&
      matchesQuery(property, normalizedQuery)
  );
  const visible = status === "ALL" ? scoped : scoped.filter((property) => property.status === status);
  const countFor = (value: PropertyStatus) => scoped.filter((property) => property.status === value).length;

  if (isPending) return <PageSkeleton variant="cards" />;
  if (isError) {
    return <ErrorState title="No hemos podido cargar las viviendas" description="Comprueba la conexión e inténtalo de nuevo." onRetry={() => void refetch()} />;
  }

  const active = data.filter((property) => property.status !== "ARCHIVED");
  const stats = [
    { label: "Viviendas", value: active.length },
    { label: "Publicadas", value: data.filter((property) => property.status === "READY").length },
    { label: "Borradores", value: data.filter((property) => property.status === "DRAFT").length },
    { label: "Clientes", value: owners.length },
  ];

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-4 pb-10 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-7xl sm:rounded-sheet sm:p-7 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-overline text-muted">Solo equipo fundador</p>
          <h1 className="mt-2 flex items-center gap-3 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">
            Todas las viviendas
            {isFetching ? <LoaderCircle className="h-5 w-5 animate-spin text-muted" aria-label="Actualizando" /> : null}
          </h1>
        </div>
        <Link
          href="/equipo/alta-asistida"
          className="press-control inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" /> Nueva vivienda
        </Link>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-card bg-surface p-4 shadow-soft">
            <dt className="text-xs font-semibold text-secondary">{stat.label}</dt>
            <dd className="mt-1 font-rounded text-3xl font-semibold tabular-nums tracking-[-0.04em] text-brand-dark">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-96">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título, dirección o cliente"
            leftElement={<Search className="h-4 w-4" />}
            aria-label="Buscar viviendas"
          />
        </div>
        <select
          value={ownerFilter}
          onChange={(event) => setOwnerFilter(event.target.value)}
          aria-label="Filtrar por cliente"
          className="h-11.5 rounded-14 border border-border bg-surface px-4 text-sm font-semibold text-brand-dark shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 lg:w-64"
        >
          <option value="ALL">Todos los clientes</option>
          {owners.map((owner) => (
            <option key={owner.id} value={String(owner.id)}>
              {owner.name} ({owner.count})
            </option>
          ))}
        </select>
      </div>

      <div
        role="tablist"
        aria-label="Estado"
        className="scroll-fade-x -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:px-5 [&::-webkit-scrollbar]:hidden"
      >
        {(["ALL", ...STATUS_ORDER] as StatusFilter[]).map((value) => {
          const count = value === "ALL" ? scoped.length : countFor(value);
          if (value !== "ALL" && value !== "DRAFT" && value !== "READY" && count === 0) return null;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={status === value}
              onClick={() => setStatus(value)}
              className={cn(
                "press-control inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors",
                status === value ? "bg-brand-dark text-white" : "bg-surface text-secondary shadow-soft hover:text-brand-dark"
              )}
            >
              {value === "ALL" ? "Todas" : TEAM_STATUS_LABELS[value]}
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", status === value ? "bg-white/15" : "bg-surface-soft")}>{count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            variant={data.length === 0 ? "generic" : "search"}
            title={data.length === 0 ? "Aún no hay viviendas" : "Ninguna vivienda coincide"}
            description={data.length === 0 ? "Empieza con el alta asistida de la primera vivienda." : "Prueba con otra búsqueda o quita algún filtro."}
            action={
              data.length === 0 ? (
                <Link href="/equipo/alta-asistida" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" /> Nueva vivienda
                </Link>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((property) => (
            <li key={property.id}>
              <TeamPropertyCard property={property} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamPropertyCard({ property }: { property: TeamPropertySummary }) {
  const [imageFailed, setImageFailed] = useState(false);
  const OwnerIcon = property.owner.owner_type === "INDIVIDUAL" ? UserRound : Building2;
  const location = [property.address_line, property.neighborhood].filter(Boolean).join(" · ");
  const missing = property.missing_fields;

  return (
    <Link
      href={`/equipo/viviendas/${property.id}`}
      className="press group flex h-full flex-col overflow-hidden rounded-panel bg-surface shadow-soft transition-shadow duration-200 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-soft">
        {property.cover_image_url && !imageFailed ? (
          <Image
            src={property.cover_image_url}
            alt=""
            fill
            unoptimized
            onError={() => setImageFailed(true)}
            sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-secondary">
            <ImagePlus className="h-6 w-6 text-primary" />
            <span className="text-xs font-semibold">Sin fotos</span>
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-bold text-brand-dark shadow-soft backdrop-blur">
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[property.status])} />
          {TEAM_STATUS_LABELS[property.status]}
        </span>
        {property.image_count > 0 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-2xs font-bold text-white backdrop-blur">
            {property.image_count} {property.image_count === 1 ? "foto" : "fotos"}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary">
          <OwnerIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{property.owner.display_name}</span>
          <span className="ml-auto shrink-0 text-2xs font-medium text-muted">{formatRelative(property.updated_at)}</span>
        </p>
        <h2 className={cn("mt-1.5 line-clamp-2 font-rounded text-lg font-semibold leading-snug tracking-[-0.02em]", property.title ? "text-brand-dark" : "text-muted")}>
          {property.title || "Sin título"}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-secondary">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location || "Dirección pendiente"}</span>
        </p>

        <div className="mt-3 flex items-end justify-between gap-3">
          <p>
            <strong className="font-rounded text-xl font-semibold tracking-[-0.03em] text-brand-dark">{formatEuros(property.total_monthly_rent)}</strong>
            <span className="ml-1 text-xs font-semibold text-secondary">/ mes</span>
          </p>
          <p className="flex items-center gap-2.5 text-xs font-semibold text-secondary [&_svg]:h-4 [&_svg]:w-4">
            <span className="flex items-center gap-1"><BedDouble />{property.bedrooms}</span>
            <span className="flex items-center gap-1"><Bath />{property.bathrooms}</span>
            <span className="flex items-center gap-1"><Users />{property.max_tenants}</span>
          </p>
        </div>

        <div className="mt-auto pt-3">
          {missing.length ? (
            <p className="flex items-center gap-1.5 rounded-10 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800">
              <CircleAlert className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Falta: {missing.join(", ")}</span>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 rounded-10 bg-primary/[0.06] px-2.5 py-2 text-xs font-semibold text-primary-dark">
              <CircleCheck className="h-3.5 w-3.5 shrink-0" />
              Ficha completa
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
