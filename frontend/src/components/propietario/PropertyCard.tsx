"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, ViewTransition } from "react";
import { Archive, ArrowRight, BedDouble, CalendarDays, Eye, ImageIcon, KeyRound, LoaderCircle, MapPin, MoreHorizontal, Pause, Pencil, Play, Users } from "lucide-react";
import PropertyStatusBadge from "./PropertyStatusBadge";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { PropertyStatus, PropertySummary } from "@/types/property";

export default function PropertyCard({ property, onPause, onResume, onMarkRented, onArchive }: { property: PropertySummary; onPause: (id: number) => Promise<void>; onResume: (id: number) => Promise<void>; onMarkRented: (id: number) => Promise<void>; onArchive: (id: number) => Promise<void> }) {
  const [imageError, setImageError] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState("");

  async function run(action: (id: number) => Promise<void>) {
    if (actioning) return;
    setActioning(true);
    setError("");
    try { await action(property.id); }
    catch (caught) { setError(getCommunityErrorMessage(caught, "No hemos podido actualizar la vivienda.")); }
    finally { setActioning(false); }
  }

  function runArchive() {
    if (window.confirm(`¿Archivar "${property.title}"? Dejará de estar disponible y se conservará como referencia.`)) void run(onArchive);
  }

  const location = property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city;
  const rent = property.total_monthly_rent === null ? "Precio pendiente" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`;
  const guidance = getGuidance(property.status);

  return (
    <article className="group overflow-hidden rounded-[26px] border border-black/[0.045] bg-surface shadow-soft transition-shadow duration-200 hover:shadow-[0_16px_38px_rgba(20,42,32,.09)] sm:grid sm:grid-cols-[18rem_1fr]">
      <Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-forward"]} className="relative block aspect-[16/10] overflow-hidden bg-surface-soft sm:aspect-auto sm:min-h-64" aria-label={`Abrir ${property.title}`}>
        <ViewTransition name={detailTransitionName("property", property.id)} share="coflow-detail-morph">
          <div className="relative h-full w-full overflow-hidden">
            {property.cover_image_url && !imageError ? (
              <Image src={property.cover_image_url} alt="" fill unoptimized onError={() => setImageError(true)} sizes="(min-width: 640px) 288px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.015]" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-secondary"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><ImageIcon className="h-5 w-5" /></span><span className="text-xs font-bold">Añade una foto de portada</span></div>
            )}
          </div>
        </ViewTransition>
        <span className="absolute left-3 top-3"><PropertyStatusBadge status={property.status} /></span>
      </Link>

      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-secondary"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /> <span className="truncate">{location}</span></p>
            <h2 className="mt-1.5 line-clamp-2 font-rounded text-xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-2xl">{property.title}</h2>
          </div>
          <PropertyMenu property={property} actioning={actioning} onPause={() => void run(onPause)} onResume={() => void run(onResume)} onMarkRented={() => void run(onMarkRented)} onArchive={runArchive} />
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div><strong className="font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">{rent}</strong>{property.total_monthly_rent !== null && <span className="ml-1 text-xs font-semibold text-secondary">/ mes</span>}</div>
          <div className="flex items-center gap-3 text-xs font-semibold text-secondary"><span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{property.bedrooms}</span><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{property.max_tenants} plazas</span></div>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-[18px] bg-surface-soft p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-soft">{guidance.icon}</span>
          <div className="min-w-0"><p className="text-xs font-bold text-brand-dark">{guidance.title}</p><p className="mt-0.5 text-xs leading-5 text-secondary">{guidance.text}</p></div>
        </div>

        {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
          <PrimaryAction property={property} actioning={actioning} onResume={() => void run(onResume)} />
          <Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-soft px-4 text-sm font-bold text-brand-dark transition hover:bg-mint-50"><Pencil className="h-4 w-4" />Editar</Link>
        </div>
      </div>
    </article>
  );
}

function PrimaryAction({ property, actioning, onResume }: { property: PropertySummary; actioning: boolean; onResume: () => void }) {
  if (property.status === "DRAFT") return <Link href={`/propietarios/pisos/nuevo?draft=${property.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button">Continuar anuncio <ArrowRight className="h-4 w-4" /></Link>;
  if (property.status === "PAUSED") return <button type="button" disabled={actioning} onClick={onResume} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button disabled:opacity-50">{actioning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Reactivar anuncio</button>;
  return <Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-forward"]} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button"><Eye className="h-4 w-4" />Ver vivienda</Link>;
}

function PropertyMenu({ property, actioning, onPause, onResume, onMarkRented, onArchive }: { property: PropertySummary; actioning: boolean; onPause: () => void; onResume: () => void; onMarkRented: () => void; onArchive: () => void }) {
  return <details className="group/menu relative"><summary aria-label={`Más acciones para ${property.title}`} className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-surface-soft text-secondary transition hover:bg-mint-50 hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">{actioning ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}</summary><div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-[18px] border border-border bg-surface p-1.5 shadow-[0_16px_40px_rgba(20,42,32,.16)]">
    {property.status === "READY" && <MenuButton icon={<Pause />} label="Pausar anuncio" onClick={onPause} disabled={actioning} />}
    {property.status === "PAUSED" && <MenuButton icon={<Play />} label="Reactivar anuncio" onClick={onResume} disabled={actioning} />}
    {["READY", "PAUSED"].includes(property.status) && <MenuButton icon={<KeyRound />} label="Marcar como alquilado" onClick={onMarkRented} disabled={actioning} />}
    {property.status !== "ARCHIVED" && <MenuButton icon={<Archive />} label="Archivar vivienda" onClick={onArchive} disabled={actioning} danger />}
  </div></details>;
}

function MenuButton({ icon, label, onClick, disabled, danger = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled: boolean; danger?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`flex min-h-11 w-full items-center gap-3 rounded-14 px-3 text-left text-sm font-semibold transition disabled:opacity-50 ${danger ? "text-red-600 hover:bg-red-50" : "text-brand-dark hover:bg-surface-soft"}`}><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</button>;
}

function getGuidance(status: PropertyStatus) {
  const map: Record<PropertyStatus, { title: string; text: string; icon: React.ReactNode }> = {
    DRAFT: { title: "Termina la publicación", text: "Completa la información pendiente para dejarla preparada.", icon: <ArrowRight className="h-4 w-4" /> },
    READY: { title: "Preparada para el lanzamiento", text: "La vivienda está completa y guardada para la futura publicación.", icon: <CalendarDays className="h-4 w-4" /> },
    PUBLISHED: { title: "Anuncio visible", text: "La vivienda está publicada y puede recibir interés.", icon: <Eye className="h-4 w-4" /> },
    PAUSED: { title: "Visibilidad detenida", text: "Reactívala cuando quieras volver a recibir interés.", icon: <Pause className="h-4 w-4" /> },
    RENTED: { title: "Vivienda alquilada", text: "Conservamos el anuncio y su contexto en tu cartera.", icon: <KeyRound className="h-4 w-4" /> },
    ARCHIVED: { title: "Fuera de la cartera activa", text: "El anuncio se conserva como referencia, sin actividad.", icon: <Archive className="h-4 w-4" /> },
  };
  return map[status];
}
