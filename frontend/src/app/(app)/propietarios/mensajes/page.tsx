"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2, Clock3, Inbox, MessageCircle, Plus, Search, Send, Users } from "lucide-react";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import { getMyProperties } from "@/services/properties";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread" | "archived";

export default function OwnerMessagesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [propertyId, setPropertyId] = useState("all");
  const { data: properties = [], isLoading, isError, refetch } = useQuery({ queryKey: ["my-properties"], queryFn: () => getMyProperties() });

  if (isLoading) return <PageSkeleton variant="profile" />;
  if (isError) return <ErrorState title="No pudimos abrir tus conversaciones" description="Comprueba tu conexión e inténtalo de nuevo." onRetry={() => void refetch()} />;

  return (
    <div className="explore-shell -mx-6 -mt-4 flex min-h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] w-[calc(100%+3rem)] flex-col px-6 pb-8 pt-5 sm:mx-auto sm:mt-0 sm:min-h-[calc(100dvh-var(--mobile-header-height)-3rem)] sm:w-full sm:max-w-7xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Panel de propietario</p><h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-4xl">Mensajes</h1><p className="mt-2 text-sm leading-6 text-secondary">Conversaciones organizadas por vivienda.</p></div><Link href="/propietarios/solicitudes" className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-surface px-4 text-sm font-bold text-brand-dark shadow-soft sm:self-auto"><Users className="h-4 w-4" /> Ver solicitudes</Link></header>

      <section className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex min-h-12 items-center gap-3 rounded-16 border border-black/[0.05] bg-surface px-4 shadow-soft focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10"><Search className="h-5 w-5 text-muted" /><span className="sr-only">Buscar conversaciones</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar persona, vivienda o mensaje" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" /></label>
        <label className="relative"><span className="sr-only">Filtrar por vivienda</span><Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><select value={propertyId} onChange={(event) => setPropertyId(event.target.value)} className="h-12 w-full appearance-none rounded-16 border border-black/[0.05] bg-surface pl-10 pr-9 text-sm font-semibold text-brand-dark shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-64"><option value="all">Todas las viviendas</option>{properties.map((property) => <option key={property.id} value={String(property.id)}>{property.title}</option>)}</select></label>
      </section>

      <div role="tablist" aria-label="Filtrar conversaciones" className="mt-4 flex w-fit gap-1 rounded-14 bg-black/[0.045] p-1">{(["all", "unread", "archived"] as Filter[]).map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={cn("min-h-10 rounded-10 px-4 text-xs font-bold transition", filter === item ? "bg-surface text-brand-dark shadow-sm" : "text-secondary")}>{filterLabel(item)}</button>)}</div>

      <section className="mt-4 grid min-h-0 flex-1 overflow-hidden rounded-[28px] border border-black/[0.05] bg-surface shadow-soft lg:grid-cols-[minmax(20rem,.72fr)_1.28fr]">
        <div className="flex min-h-[30rem] flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-bold text-brand-dark">Conversaciones</h2><p className="mt-0.5 text-xs text-muted">0 en esta vista</p></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-50 text-primary"><Inbox className="h-4 w-4" /></span></div>
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-primary"><MessageCircle className="h-6 w-6" /></span><h3 className="mt-4 font-rounded text-xl font-semibold text-brand-dark">{emptyTitle(filter, search)}</h3><p className="mt-2 max-w-sm text-xs leading-5 text-secondary">{emptyDescription(filter, search)}</p>{properties.length === 0 && <Link href="/propietarios/pisos/nuevo" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Publicar vivienda</Link>}</div>
        </div>

        <div className="hidden min-h-[30rem] flex-col items-center justify-center bg-[#f7f9f7] px-8 text-center lg:flex"><div className="relative"><span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-surface text-primary shadow-soft"><Send className="h-8 w-8" /></span><span className="absolute -right-2 -top-2 h-5 w-5 rounded-full border-4 border-[#f7f9f7] bg-primary" /></div><h2 className="mt-6 font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">Selecciona una conversación</h2><p className="mt-2 max-w-sm text-sm leading-6 text-secondary">Aquí verás el chat junto al contexto de la vivienda y la solicitud relacionada.</p><div className="mt-6 flex flex-wrap justify-center gap-2"><ContextChip icon={<Building2 />} label="Vivienda" /><ContextChip icon={<Clock3 />} label="Última actividad" /><ContextChip icon={<CheckCircle2 />} label="Estado" /></div></div>
      </section>

      <p className="mt-4 text-center text-xs leading-5 text-muted">Las conversaciones aparecerán cuando conectemos las solicitudes de vivienda con sus candidatos.</p>
    </div>
  );
}

function ContextChip({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-2 text-xs font-semibold text-secondary shadow-soft [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}{label}</span>; }
function filterLabel(filter: Filter) { return filter === "all" ? "Todas" : filter === "unread" ? "Sin responder" : "Archivadas"; }
function emptyTitle(filter: Filter, search: string) { if (search.trim()) return "No hay coincidencias"; if (filter === "unread") return "Todo respondido"; if (filter === "archived") return "No hay conversaciones archivadas"; return "Aún no hay conversaciones"; }
function emptyDescription(filter: Filter, search: string) { if (search.trim()) return "Prueba con otro nombre, vivienda o término de búsqueda."; if (filter === "unread") return "Las conversaciones que requieran tu respuesta aparecerán aquí."; if (filter === "archived") return "Puedes archivar conversaciones terminadas para mantener la bandeja ordenada."; return "Cuando una solicitud genere una conversación, aparecerá ligada a su vivienda."; }
