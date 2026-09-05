"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, CheckCircle2, Clock3, Inbox, Plus, Search, ShieldCheck, Users } from "lucide-react";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import { getMyProperties } from "@/services/properties";
import { cn } from "@/lib/utils";

type Tab = "new" | "review" | "resolved";

export default function SolicitudesPropietarioPage() {
  const [tab, setTab] = useState<Tab>("new");
  const [propertyId, setPropertyId] = useState("all");
  const { data: properties = [], isLoading, isError, refetch } = useQuery({ queryKey: ["my-properties"], queryFn: () => getMyProperties() });

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState title="No pudimos preparar tus solicitudes" description="Comprueba tu conexión e inténtalo de nuevo." onRetry={() => void refetch()} />;

  const availableProperties = properties.filter((item) => ["READY", "PUBLISHED", "PAUSED"].includes(item.status));
  const hasPublishedProperty = properties.some((item) => ["READY", "PUBLISHED"].includes(item.status));

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-10 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-7xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Panel de propietario</p><h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Solicitudes</h1><p className="mt-2 text-sm leading-6 text-secondary">Revisa y organiza el interés por cada vivienda.</p></div>
        <Link href="/propietarios/pisos" className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-surface px-4 text-sm font-bold text-brand-dark shadow-soft sm:self-auto"><Building2 className="h-4 w-4" /> Ver viviendas</Link>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Resumen de solicitudes">
        <Summary value="0" label="Nuevas" icon={<Inbox />} active={tab === "new"} onClick={() => setTab("new")} />
        <Summary value="0" label="En revisión" icon={<Clock3 />} active={tab === "review"} onClick={() => setTab("review")} />
        <Summary value="0" label="Resueltas" icon={<CheckCircle2 />} active={tab === "resolved"} onClick={() => setTab("resolved")} />
      </section>

      <section className="mt-4 rounded-[24px] border border-primary/10 bg-mint-50/70 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
        <div className="flex items-start gap-3"><span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-brand-dark">Bandeja preparada, sin actividad ficticia</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-secondary">La recepción de candidaturas todavía no está conectada. Cuando lo esté, aparecerán aquí con la vivienda, el estado y las acciones correspondientes.</p></div></div>
      </section>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Estado de solicitud" className="grid grid-cols-3 rounded-14 bg-black/[0.045] p-1 sm:w-[26rem]">{(["new", "review", "resolved"] as Tab[]).map((item) => <TabButton key={item} active={tab === item} onClick={() => setTab(item)}>{tabLabel(item)}</TabButton>)}</div>
        <label className="relative min-w-0 sm:w-64"><span className="sr-only">Filtrar por vivienda</span><Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="h-11 w-full appearance-none rounded-14 border border-black/[0.06] bg-surface pl-10 pr-8 text-sm font-semibold text-brand-dark shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"><option value="all">Todas las viviendas</option>{availableProperties.map((item) => <option key={item.id} value={String(item.id)}>{item.title}</option>)}</select></label>
      </div>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="flex min-h-[25rem] flex-col items-center justify-center rounded-[28px] bg-surface px-6 py-12 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-50 text-primary">{tab === "new" ? <Inbox className="h-7 w-7" /> : tab === "review" ? <Search className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}</span>
          <h2 className="mt-5 font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">{emptyTitle(tab)}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">{emptyDescription(tab, hasPublishedProperty)}</p>
          {!hasPublishedProperty && <Link href={properties.length ? "/propietarios/pisos" : "/propietarios/pisos/nuevo"} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white">{properties.length ? "Preparar una vivienda" : <><Plus className="h-4 w-4" /> Publicar vivienda</>}<ArrowRight className="h-4 w-4" /></Link>}
        </div>

        <aside className="rounded-[24px] bg-surface p-5 shadow-soft"><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Cómo funcionará</p><ol className="mt-4 space-y-5"><Step number="1" title="Recibes la solicitud" text="Ligada a una vivienda concreta." /><Step number="2" title="Revisas el perfil" text="Datos relevantes y contexto reunidos." /><Step number="3" title="Decides con calma" text="Preselecciona, conversa o descarta." /></ol><div className="mt-5 border-t border-border pt-4"><p className="flex items-center gap-2 text-xs font-semibold text-secondary"><Users className="h-4 w-4 text-primary" /> Sin candidatos inventados</p></div></aside>
      </section>
    </div>
  );
}

function Summary({ value, label, icon, active, onClick }: { value: string; label: string; icon: React.ReactNode; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} aria-pressed={active} className={cn("rounded-[20px] border p-3 text-left transition sm:p-4", active ? "border-primary/20 bg-surface shadow-soft" : "border-transparent bg-surface/55 hover:bg-surface")}><span className={cn("flex h-8 w-8 items-center justify-center rounded-full [&>svg]:h-4 [&>svg]:w-4", active ? "bg-primary text-white" : "bg-surface-soft text-muted")}>{icon}</span><strong className="mt-3 block font-rounded text-2xl font-semibold text-brand-dark">{value}</strong><span className="block truncate text-[11px] font-semibold text-secondary sm:text-xs">{label}</span></button>; }
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn("min-h-10 rounded-10 px-2 text-xs font-bold transition", active ? "bg-surface text-brand-dark shadow-sm" : "text-secondary")}>{children}</button>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint-50 text-xs font-bold text-primary-dark">{number}</span><div><p className="text-sm font-bold text-brand-dark">{title}</p><p className="mt-0.5 text-xs leading-5 text-secondary">{text}</p></div></li>; }
function tabLabel(tab: Tab) { return tab === "new" ? "Nuevas" : tab === "review" ? "En revisión" : "Resueltas"; }
function emptyTitle(tab: Tab) { return tab === "new" ? "No hay solicitudes nuevas" : tab === "review" ? "Nada pendiente de revisión" : "Aún no hay decisiones guardadas"; }
function emptyDescription(tab: Tab, hasPublishedProperty: boolean) { if (!hasPublishedProperty) return "Prepara y publica una vivienda para que pueda recibir interés cuando activemos este flujo."; return tab === "new" ? "Cuando llegue una candidatura aparecerá aquí, ordenada por fecha y vivienda." : tab === "review" ? "Las candidaturas que quieras estudiar con más calma quedarán reunidas aquí." : "Las solicitudes aceptadas o descartadas conservarán su contexto en este espacio."; }
