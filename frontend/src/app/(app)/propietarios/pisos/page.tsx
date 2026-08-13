"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import SkeletonCard from "@/components/ui/SkeletonCard";
import PropertyCard from "@/components/propietario/PropertyCard";
import {
  archiveProperty,
  getMyProperties,
  markPropertyReady,
  markPropertyRented,
  pauseProperty,
  resumeProperty,
} from "@/services/properties";

const QUERY_KEY = ["my-properties"];

export default function MisPisosPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getMyProperties(),
    enabled: Boolean(ownerProfile),
  });

  async function refresh(action: () => Promise<unknown>) {
    await action();
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }

  if (ownerProfileLoading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;
  if (!ownerProfile) return <EmptyOwner />;

  const activeCount = properties.filter((item) => ["READY", "PUBLISHED"].includes(item.status)).length;

  return (
    <div className="mx-auto w-full max-w-6xl pb-6">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-bold text-primary">Espacio propietario</p><h1 className="mt-1 font-rounded text-4xl font-bold tracking-[-0.04em] text-brand-dark sm:text-5xl">Mis pisos</h1><p className="mt-2 text-sm text-secondary">{activeCount} activos · {properties.length} en total</p></div>
        <Link href="/propietarios/pisos/nuevo" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5"><Plus className="h-5 w-5" />Añadir piso</Link>
      </header>

      <section className="mt-8">
        {isLoading ? <div className="grid gap-5 sm:grid-cols-2"><SkeletonCard withCover /><SkeletonCard withCover /></div> : isError ? <ErrorState /> : properties.length === 0 ? <EmptyProperties /> : <div className="grid gap-5 sm:grid-cols-2">{properties.map((property) => <PropertyCard key={property.id} property={property} onMarkReady={(id) => refresh(() => markPropertyReady(id))} onPause={(id) => refresh(() => pauseProperty(id))} onResume={(id) => refresh(() => resumeProperty(id))} onMarkRented={(id) => refresh(() => markPropertyRented(id))} onArchive={(id) => refresh(() => archiveProperty(id))} />)}</div>}
      </section>
    </div>
  );
}

function EmptyOwner() { return <div className="mx-auto max-w-xl rounded-24 border border-border bg-surface p-8 text-center shadow-soft"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-2xl font-bold text-brand-dark">Crea tu perfil de propietario</h1><Link href="/propietarios/perfil" className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 font-bold text-white">Empezar</Link></div>; }
function EmptyProperties() { return <div className="rounded-24 border border-border bg-surface px-6 py-14 text-center shadow-soft"><Building2 className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-5 text-2xl font-bold text-brand-dark">Tu primer piso empieza aquí</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary">Publica tu vivienda y gestiona todo desde un único lugar.</p><Link href="/propietarios/pisos/nuevo" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-bold text-white"><Plus className="h-5 w-5" />Añadir piso</Link></div>; }
function ErrorState() { return <div className="rounded-24 border border-red-200 bg-surface p-8 text-center text-sm font-semibold text-red-600">No hemos podido cargar tus pisos.</div>; }
