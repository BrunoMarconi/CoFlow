"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Clock3, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import SkeletonCard from "@/components/ui/SkeletonCard";
import PropertyCard from "@/components/propietario/PropertyCard";
import { archiveProperty, getMyProperties, markPropertyRented, pauseProperty, resumeProperty } from "@/services/properties";

const QUERY_KEY = ["my-properties"];

export default function MisPisosPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: properties = [], isLoading, isError } = useQuery({ queryKey: QUERY_KEY, queryFn: () => getMyProperties(), enabled: Boolean(ownerProfile) });

  async function refresh(action: () => Promise<unknown>) { await action(); await queryClient.invalidateQueries({ queryKey: QUERY_KEY }); }
  if (ownerProfileLoading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;
  if (!ownerProfile) return <EmptyOwner />;

  const activeCount = properties.filter((item) => ["READY", "PUBLISHED"].includes(item.status)).length;
  const reviewCount = properties.filter((item) => item.status === "DRAFT").length;

  return (
    <div className="mx-auto w-full max-w-6xl pb-6">
      <header className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#717171]">Espacio propietario</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#191919] sm:text-5xl">Mis pisos</h1><p className="mt-2 text-sm text-[#717171]">Gestiona tus anuncios desde un solo lugar</p></div>
        <Link href="/propietarios/pisos/nuevo" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition hover:bg-[#282828]"><Plus className="h-5 w-5" />Añadir piso</Link>
      </header>

      <section className="mt-7 grid grid-cols-3 divide-x divide-[#e6e6e6] rounded-[1.5rem] border border-[#dddddd] bg-white py-5 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <Summary icon={<Building2 />} value={properties.length} label="Pisos" />
        <Summary icon={<CheckCircle2 />} value={activeCount} label="Activos" />
        <Summary icon={<Clock3 />} value={reviewCount} label="Por completar" />
      </section>

      <section className="mt-6">
        {isLoading ? <div className="grid gap-4"><SkeletonCard withCover /><SkeletonCard withCover /></div> : isError ? <ErrorState /> : properties.length === 0 ? <EmptyProperties /> : <div className="grid gap-4">{properties.map((property) => <PropertyCard key={property.id} property={property} onPause={(id) => refresh(() => pauseProperty(id))} onResume={(id) => refresh(() => resumeProperty(id))} onMarkRented={(id) => refresh(() => markPropertyRented(id))} onArchive={(id) => refresh(() => archiveProperty(id))} />)}</div>}
      </section>
    </div>
  );
}

function Summary({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) { return <div className="flex items-center justify-center gap-3 px-2"><span className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f5] sm:flex [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div><strong className="block text-xl font-semibold text-[#191919]">{value}</strong><span className="text-xs text-[#717171]">{label}</span></div></div>; }
function EmptyOwner() { return <div className="mx-auto max-w-xl rounded-[1.5rem] border border-[#dddddd] bg-white p-8 text-center"><Building2 className="mx-auto h-10 w-10" /><h1 className="mt-4 text-2xl font-semibold">Crea tu perfil de propietario</h1><Link href="/propietarios/perfil" className="mt-6 inline-flex h-12 items-center rounded-full bg-black px-6 font-semibold text-white">Empezar</Link></div>; }
function EmptyProperties() { return <div className="rounded-[1.5rem] border border-[#dddddd] bg-white px-6 py-14 text-center"><Building2 className="mx-auto h-12 w-12" /><h2 className="mt-5 text-2xl font-semibold">Publica gratis tu primera vivienda</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#717171]">Añade un piso o una habitación en Málaga. No necesitas tarjeta y podrás editar o pausar el anuncio cuando quieras.</p><Link href="/propietarios/pisos/nuevo" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-black px-6 font-semibold text-white"><Plus className="h-5 w-5" />Publicar gratis</Link></div>; }
function ErrorState() { return <div className="rounded-[1.5rem] border border-red-200 bg-white p-8 text-center text-sm font-semibold text-red-600">No hemos podido cargar tus pisos.</div>; }
