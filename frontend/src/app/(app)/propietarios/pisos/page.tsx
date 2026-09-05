"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Building2, CheckCircle2, CircleAlert, Clock3, Euro, MessageCircle, Plus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import PropertyCard from "@/components/propietario/PropertyCard";
import { archiveProperty, getMyProperties, markPropertyRented, pauseProperty, resumeProperty } from "@/services/properties";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/property";

const QUERY_KEY = ["my-properties"];
type Filter = "ALL" | "ACTIVE" | "DRAFT" | "PAUSED" | "RENTED";

export default function MisPisosPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("ALL");
  const { data: properties = [], isLoading, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: () => getMyProperties(), enabled: Boolean(ownerProfile) });

  async function refresh(action: () => Promise<unknown>) { await action(); await queryClient.invalidateQueries({ queryKey: QUERY_KEY }); }
  const filtered = useMemo(() => properties.filter((item) => filter === "ALL" || filterMatches(filter, item.status)), [filter, properties]);

  if (ownerProfileLoading) return <PageSkeleton />;
  if (!ownerProfile) return <EmptyOwner />;

  const active = properties.filter((item) => ["READY", "PUBLISHED"].includes(item.status));
  const drafts = properties.filter((item) => item.status === "DRAFT");
  const paused = properties.filter((item) => item.status === "PAUSED");
  const expectedRent = active.reduce((total, item) => total + (item.total_monthly_rent ?? 0), 0);
  const attentionCount = drafts.length + paused.length;

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-10 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-7xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Panel de propietario</p><h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Buenos días</h1><p className="mt-2 text-sm leading-6 text-secondary">Lo importante de tus viviendas, de un vistazo.</p></div>
        <Link href="/propietarios/pisos/nuevo" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(20,55,41,.18)] transition hover:-translate-y-0.5 sm:px-5"><Plus className="h-4.5 w-4.5" /> <span className="hidden sm:inline">Publicar vivienda</span><span className="sm:hidden">Publicar</span></Link>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de cartera">
        <Metric icon={<Building2 />} label="Viviendas" value={String(properties.length)} hint="en tu cartera" />
        <Metric icon={<CheckCircle2 />} label="Publicadas" value={String(active.length)} hint="visibles ahora" positive />
        <Metric icon={<Euro />} label="Renta anunciada" value={`${expectedRent.toLocaleString("es-ES")} €`} hint="al mes" />
        <Metric icon={<CircleAlert />} label="Requieren atención" value={String(attentionCount)} hint={attentionCount ? "acciones pendientes" : "todo al día"} warning={attentionCount > 0} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-[26px] bg-brand-dark p-5 text-white shadow-[0_18px_45px_rgba(20,55,41,.14)] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-white/50">Siguiente acción</p><h2 className="mt-2 font-rounded text-2xl font-semibold tracking-[-0.03em]">{attentionCount ? "Pon tu cartera al día" : properties.length ? "Todo listo para recibir interés" : "Publica tu primera vivienda"}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">{drafts.length ? `${drafts.length} ${drafts.length === 1 ? "anuncio está" : "anuncios están"} sin terminar.` : paused.length ? "Puedes reactivar tus anuncios pausados cuando quieras." : "Revisa solicitudes y conversaciones desde este panel."}</p></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10"><Clock3 className="h-5 w-5" /></span></div>
          <div className="mt-5 flex flex-wrap gap-2">{drafts[0] ? <Link href={`/propietarios/pisos/nuevo?draft=${drafts[0].id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand-dark">Continuar anuncio <ArrowRight className="h-4 w-4" /></Link> : <Link href="/propietarios/solicitudes" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand-dark">Revisar solicitudes <ArrowRight className="h-4 w-4" /></Link>}<Link href="/propietarios/mensajes" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15"><MessageCircle className="h-4 w-4" /> Mensajes</Link></div>
        </section>

        <section className="rounded-[26px] border border-black/[0.05] bg-surface p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Accesos rápidos</p><div className="mt-3 divide-y divide-border/70"><QuickLink href="/propietarios/solicitudes" icon={<Users />} title="Solicitudes" subtitle="Revisa personas interesadas" /><QuickLink href="/propietarios/mensajes" icon={<MessageCircle />} title="Conversaciones" subtitle="Continúa donde lo dejaste" /></div></section>
      </div>

      <section className="mt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Cartera</p><h2 className="mt-1 font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Tus viviendas</h2></div><div className="flex gap-1 overflow-x-auto rounded-14 bg-black/[0.04] p-1 [scrollbar-width:none]">{(["ALL", "ACTIVE", "DRAFT", "PAUSED", "RENTED"] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={cn("min-h-10 shrink-0 rounded-10 px-3 text-xs font-bold transition", filter === item ? "bg-white text-brand-dark shadow-sm" : "text-secondary")}>{filterLabel(item)}</button>)}</div></div>
        <div className="mt-4">{isLoading ? <PageSkeleton /> : isError ? <ErrorState title="No pudimos cargar tus viviendas" description="Comprueba tu conexión e inténtalo de nuevo." onRetry={() => void refetch()} /> : properties.length === 0 ? <EmptyProperties /> : filtered.length === 0 ? <div className="rounded-[24px] bg-surface p-10 text-center shadow-soft"><p className="font-bold text-brand-dark">No hay viviendas en este estado</p><button type="button" onClick={() => setFilter("ALL")} className="mt-3 min-h-11 rounded-full px-4 text-sm font-bold text-primary-dark">Ver todas</button></div> : <div className="grid gap-4">{filtered.map((property) => <PropertyCard key={property.id} property={property} onPause={(id) => refresh(() => pauseProperty(id))} onResume={(id) => refresh(() => resumeProperty(id))} onMarkRented={(id) => refresh(() => markPropertyRented(id))} onArchive={(id) => refresh(() => archiveProperty(id))} />)}</div>}</div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value, hint, positive, warning }: { icon: React.ReactNode; label: string; value: string; hint: string; positive?: boolean; warning?: boolean }) { return <article className="rounded-[22px] border border-black/[0.045] bg-surface p-4 shadow-soft"><div className="flex items-center justify-between"><span className={cn("flex h-9 w-9 items-center justify-center rounded-full [&>svg]:h-4.5 [&>svg]:w-4.5", warning ? "bg-amber-50 text-amber-700" : positive ? "bg-mint-50 text-primary" : "bg-surface-soft text-brand-dark")}>{icon}</span><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</span></div><strong className="mt-4 block font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">{value}</strong><span className="mt-0.5 block text-xs text-secondary">{hint}</span></article>; }
function QuickLink({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) { return <Link href={href} className="group flex min-h-16 items-center gap-3 py-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-brand-dark">{title}</span><span className="block text-xs text-secondary">{subtitle}</span></span><ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5" /></Link>; }
function filterMatches(filter: Filter, status: PropertyStatus) { if (filter === "ACTIVE") return ["READY", "PUBLISHED"].includes(status); return status === filter; }
function filterLabel(filter: Filter) { return ({ ALL: "Todas", ACTIVE: "Publicadas", DRAFT: "Borradores", PAUSED: "Pausadas", RENTED: "Alquiladas" } as const)[filter]; }
function EmptyOwner() { return <div className="mx-auto max-w-xl rounded-[26px] bg-surface p-8 text-center shadow-soft"><Building2 className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 font-rounded text-2xl font-semibold">Crea tu perfil de propietario</h1><p className="mt-2 text-sm text-secondary">Necesitamos unos datos básicos antes de publicar.</p><Link href="/propietarios/perfil" className="mt-6 inline-flex h-12 items-center rounded-full bg-brand-dark px-6 font-bold text-white">Empezar</Link></div>; }
function EmptyProperties() { return <div className="rounded-[26px] bg-surface px-6 py-14 text-center shadow-soft"><Building2 className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-5 font-rounded text-2xl font-semibold">Publica tu primera vivienda</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">Crea el anuncio a tu ritmo. Puedes guardar el borrador y terminarlo más adelante.</p><Link href="/propietarios/pisos/nuevo" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand-dark px-6 font-bold text-white"><Plus className="h-5 w-5" />Empezar publicación</Link></div>; }
