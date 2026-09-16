"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import PropertyCard from "@/components/propietario/PropertyCard";
import { archiveProperty, getMyProperties, markPropertyRented, pauseProperty, resumeProperty } from "@/services/properties";
import { cn } from "@/lib/utils";
import type { PropertyStatus, PropertySummary } from "@/types/property";

const QUERY_KEY = ["my-properties"];
type Filter = "ALL" | "ACTIVE" | "DRAFT" | "PAUSED" | "RENTED";

export default function MisPisosPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data: properties = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getMyProperties(),
    enabled: Boolean(ownerProfile),
  });

  async function refresh(action: () => Promise<unknown>) {
    await action();
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }

  const filtered = useMemo(
    () => properties.filter((item) => filter === "ALL" || filterMatches(filter, item.status)),
    [filter, properties]
  );

  if (ownerProfileLoading) return <PageSkeleton />;
  if (!ownerProfile) return <EmptyOwner />;

  const active = properties.filter((item) => ["READY", "PUBLISHED"].includes(item.status));
  const drafts = properties.filter((item) => item.status === "DRAFT");
  const paused = properties.filter((item) => item.status === "PAUSED");
  const expectedRent = active.reduce((total, item) => total + (item.total_monthly_rent ?? 0), 0);

  /* Lo pendiente, dicho con nombres y apellidos. Un contador ("1 requiere
   * atención") obliga a buscar cuál; esto lleva directamente al sitio
   * donde se arregla. */
  const attention = [
    ...drafts.map((item) => ({
      id: `draft-${item.id}`,
      title: item.title?.trim() || "Anuncio sin título",
      text: "Sin terminar de publicar",
      href: `/propietarios/pisos/nuevo?draft=${item.id}`,
      cta: "Continuar",
    })),
    ...paused.map((item) => ({
      id: `paused-${item.id}`,
      title: item.title,
      text: "Pausada: no recibe interés",
      href: `/propietarios/pisos/${item.id}`,
      cta: "Revisar",
    })),
  ];

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-10 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-7xl sm:rounded-sheet sm:p-7 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="type-overline text-muted">Panel de propietario</p>
          <h1 className="mt-2 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Tus viviendas</h1>
        </div>
        <Link
          href="/propietarios/pisos/nuevo"
          className="press-control inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button hover:bg-primary-dark"
        >
          <Plus className="h-4.5 w-4.5" /> Publicar vivienda
        </Link>
      </header>

      {/* El estado de la cartera en una línea. Antes eran cuatro tarjetas
       * con cifras enormes que, en una cartera de dos o tres viviendas,
       * ocupaban más pantalla que las viviendas mismas. */}
      {properties.length > 0 && (
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-card bg-surface px-4 py-3 text-sm text-secondary shadow-soft">
          <Value amount={properties.length} singular="vivienda" plural="viviendas" />
          <Separator />
          <Value amount={active.length} singular="publicada" plural="publicadas" />
          {expectedRent > 0 && (
            <>
              <Separator />
              <span>
                <strong className="font-bold tabular-nums text-brand-dark">{expectedRent.toLocaleString("es-ES")} €</strong> al mes anunciados
              </span>
            </>
          )}
        </p>
      )}

      {attention.length > 0 && (
        <section className="mt-3 overflow-hidden rounded-panel border border-amber-200/70 bg-surface shadow-soft" aria-labelledby="atencion">
          <h2 id="atencion" className="border-b border-amber-200/70 bg-amber-50/60 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            Requiere tu atención
          </h2>
          <ul className="divide-y divide-border">
            {attention.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="press-row group flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-soft">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-brand-dark">{item.title}</span>
                    <span className="block truncate text-xs text-secondary">{item.text}</span>
                  </span>
                  <span className="hidden shrink-0 text-xs font-bold text-primary-dark sm:block">{item.cta}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Cartera</h2>
          <div className="scroll-fade-x -mx-6 flex gap-1 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:w-fit sm:rounded-14 sm:bg-black/[0.04] sm:p-1 sm:px-1 [&::-webkit-scrollbar]:hidden">
            {(["ALL", "ACTIVE", "DRAFT", "PAUSED", "RENTED"] as Filter[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
                className={cn(
                  "min-h-10 shrink-0 rounded-full px-3.5 text-xs font-bold transition sm:rounded-10 sm:px-3",
                  filter === item ? "bg-surface text-brand-dark shadow-sm" : "bg-surface text-secondary shadow-soft sm:bg-transparent sm:shadow-none"
                )}
              >
                {filterLabel(item)}
                <span className="ml-1.5 tabular-nums text-muted">{countFor(properties, item)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState title="No pudimos cargar tus viviendas" description="Comprueba tu conexión e inténtalo de nuevo." onRetry={() => void refetch()} />
          ) : properties.length === 0 ? (
            <EmptyProperties />
          ) : filtered.length === 0 ? (
            <div className="rounded-panel bg-surface p-10 text-center shadow-soft">
              <p className="font-bold text-brand-dark">No hay viviendas en este estado</p>
              <button type="button" onClick={() => setFilter("ALL")} className="mt-3 min-h-11 rounded-full px-4 text-sm font-bold text-primary-dark">
                Ver todas
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onPause={(id) => refresh(() => pauseProperty(id))}
                  onResume={(id) => refresh(() => resumeProperty(id))}
                  onMarkRented={(id) => refresh(() => markPropertyRented(id))}
                  onArchive={(id) => refresh(() => archiveProperty(id))}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Value({ amount, singular, plural }: { amount: number; singular: string; plural: string }) {
  return (
    <span>
      <strong className="font-bold tabular-nums text-brand-dark">{amount}</strong> {amount === 1 ? singular : plural}
    </span>
  );
}

function Separator() {
  return <span aria-hidden="true" className="text-muted">·</span>;
}

function countFor(properties: PropertySummary[], filter: Filter) {
  if (filter === "ALL") return properties.length;
  return properties.filter((item) => filterMatches(filter, item.status)).length;
}

function filterMatches(filter: Filter, status: PropertyStatus) {
  if (filter === "ACTIVE") return ["READY", "PUBLISHED"].includes(status);
  return status === filter;
}

function filterLabel(filter: Filter) {
  return ({ ALL: "Todas", ACTIVE: "Publicadas", DRAFT: "Borradores", PAUSED: "Pausadas", RENTED: "Alquiladas" } as const)[filter];
}

function EmptyOwner() {
  return (
    <div className="mx-auto max-w-xl rounded-panel bg-surface p-8 text-center shadow-soft">
      <Building2 className="mx-auto h-10 w-10 text-primary" />
      <h1 className="mt-4 font-rounded text-2xl font-semibold">Crea tu perfil de propietario</h1>
      <p className="mt-2 text-sm text-secondary">Necesitamos unos datos básicos antes de publicar.</p>
      <Link href="/propietarios/perfil" className="mt-6 inline-flex h-12 items-center rounded-full bg-brand-dark px-6 font-bold text-white">
        Empezar
      </Link>
    </div>
  );
}

function EmptyProperties() {
  return (
    <div className="rounded-panel bg-surface px-6 py-14 text-center shadow-soft">
      <Building2 className="mx-auto h-12 w-12 text-primary" />
      <h2 className="mt-5 font-rounded text-2xl font-semibold">Publica tu primera vivienda</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">Crea el anuncio a tu ritmo. Puedes guardar el borrador y terminarlo más adelante.</p>
      <Link href="/propietarios/pisos/nuevo" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand-dark px-6 font-bold text-white">
        <Plus className="h-5 w-5" />
        Empezar publicación
      </Link>
    </div>
  );
}
