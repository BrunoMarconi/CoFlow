"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, ViewTransition } from "react";
import { Archive, ArrowRight, BedDouble, Eye, ImageIcon, KeyRound, LoaderCircle, MapPin, MoreHorizontal, Pause, Pencil, Play, Users } from "lucide-react";
import { OWNER_STATUS_LABELS, StatusDot, statusTone } from "./DetailPrimitives";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { PropertyStatus, PropertySummary } from "@/types/property";

export default function PropertyCard({ property, onPause, onResume, onMarkRented, onArchive }: { property: PropertySummary; onPause: (id: number) => Promise<void>; onResume: (id: number) => Promise<void>; onMarkRented: (id: number) => Promise<void>; onArchive: (id: number) => Promise<void> }) {
  const [imageError, setImageError] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState("");
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  async function run(action: (id: number) => Promise<void>) {
    if (actioning) return;
    setActioning(true);
    setError("");
    try { await action(property.id); }
    catch (caught) { setError(getCommunityErrorMessage(caught, "No hemos podido actualizar la vivienda.")); }
    finally { setActioning(false); }
  }

  /* Antes esto era un window.confirm(): un diálogo del navegador, sin
   * estilo, que congela la pestaña entera y aparece pegado al borde
   * superior sin ninguna relación espacial con lo que has pulsado. Es
   * la interrupción más brusca que puede dar una interfaz, y justo en
   * el momento en que hace falta que el usuario entienda qué va a
   * pasar. ConfirmDialog nace de la pantalla, se puede descartar
   * arrastrando y muestra el progreso real del archivado. */
  async function runArchive() {
    await run(onArchive);
    setConfirmingArchive(false);
  }

  const location = property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city;
  const rent = property.total_monthly_rent === null ? "Precio pendiente" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`;
  const guidance = getGuidance(property.status);

  return (
    <article className="group overflow-hidden rounded-panel border border-black/[0.045] bg-surface shadow-soft transition-shadow duration-200 hover:shadow-overlay sm:grid sm:grid-cols-[15rem_1fr]">
      <Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-forward"]} className="relative block aspect-[16/10] overflow-hidden bg-surface-soft sm:aspect-auto sm:min-h-52" aria-label={`Abrir ${property.title}`}>
        <ViewTransition name={detailTransitionName("property", property.id)} share="coflow-detail-morph">
          <div className="relative h-full w-full overflow-hidden">
            {property.cover_image_url && !imageError ? (
              <Image src={property.cover_image_url} alt="" fill unoptimized onError={() => setImageError(true)} sizes="(min-width: 640px) 240px, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.015]" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-secondary"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><ImageIcon className="h-5 w-5" /></span><span className="text-xs font-bold">Añade una foto de portada</span></div>
            )}
          </div>
        </ViewTransition>
      </Link>

      <div className="flex min-w-0 flex-col p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {/* El estado va con el resto del texto, no como pastilla sobre
             * la foto: encima de una portada clara el badge se perdía, y
             * encima de una oscura tapaba justo la parte que se mira. */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusDot tone={statusTone(property.status)} label={OWNER_STATUS_LABELS[property.status]} />
              <span aria-hidden="true" className="text-xs text-muted">·</span>
              <p className="flex min-w-0 items-center gap-1 text-xs font-semibold text-secondary"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /> <span className="truncate">{location}</span></p>
            </div>
            <h2 className="mt-1.5 line-clamp-2 font-rounded text-lg font-semibold tracking-[-0.03em] text-brand-dark sm:text-xl">{property.title}</h2>
          </div>
          <PropertyMenu property={property} actioning={actioning} onPause={() => void run(onPause)} onResume={() => void run(onResume)} onMarkRented={() => void run(onMarkRented)} onArchive={() => setConfirmingArchive(true)} />
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div><strong className="font-rounded text-xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-2xl">{rent}</strong>{property.total_monthly_rent !== null && <span className="ml-1 text-xs font-semibold text-secondary">/ mes</span>}</div>
          <div className="flex items-center gap-3 text-xs font-semibold text-secondary"><span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{property.bedrooms}</span><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{property.max_tenants} plazas</span></div>
        </div>

        <p className="mt-3 border-t border-black/[0.05] pt-3 text-xs leading-5 text-secondary">
          <span className="font-bold text-brand-dark">{guidance.title}.</span> {guidance.text}
        </p>

        {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
          <PrimaryAction property={property} actioning={actioning} onResume={() => void run(onResume)} />
          <Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="press-control inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-soft px-4 text-sm font-bold text-brand-dark hover:bg-black/[0.035]"><Pencil className="h-4 w-4" />Editar</Link>
        </div>
      </div>

      {confirmingArchive && (
        <ConfirmDialog
          title={`¿Archivar "${property.title}"?`}
          description="Dejará de estar disponible para quien la esté mirando y saldrá de tu cartera activa. La conservamos como referencia, así que podrás consultarla más adelante."
          confirmLabel="Archivar"
          destructive
          pending={actioning}
          onConfirm={() => void runArchive()}
          onClose={() => setConfirmingArchive(false)}
        />
      )}
    </article>
  );
}

function PrimaryAction({ property, actioning, onResume }: { property: PropertySummary; actioning: boolean; onResume: () => void }) {
  if (property.status === "DRAFT") return <Link href={`/propietarios/pisos/nuevo?draft=${property.id}`} className="press-control inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button">Continuar anuncio <ArrowRight className="h-4 w-4" /></Link>;
  if (property.status === "PAUSED") return <button type="button" disabled={actioning} onClick={onResume} className="press-control inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button disabled:opacity-50">{actioning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}Reactivar anuncio</button>;
  return <Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-forward"]} className="press-control inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button"><Eye className="h-4 w-4" />Ver vivienda</Link>;
}

function PropertyMenu({ property, actioning, onPause, onResume, onMarkRented, onArchive }: { property: PropertySummary; actioning: boolean; onPause: () => void; onResume: () => void; onMarkRented: () => void; onArchive: () => void }) {
  return <details className="group/menu relative"><summary aria-label={`Más acciones para ${property.title}`} className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-surface-soft text-secondary transition hover:bg-black/[0.035] hover:text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">{actioning ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}</summary><div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-card border border-border bg-surface p-1.5 shadow-modal">
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
  const map: Record<PropertyStatus, { title: string; text: string }> = {
    DRAFT: { title: "Termina la publicación", text: "Completa la información pendiente para dejarla preparada." },
    READY: { title: "Preparada para el lanzamiento", text: "La vivienda está completa y guardada para la futura publicación." },
    PUBLISHED: { title: "Anuncio visible", text: "La vivienda está publicada y puede recibir interés." },
    PAUSED: { title: "Visibilidad detenida", text: "Reactívala cuando quieras volver a recibir interés." },
    RENTED: { title: "Vivienda alquilada", text: "Conservamos el anuncio y su contexto en tu cartera." },
    ARCHIVED: { title: "Fuera de la cartera activa", text: "El anuncio se conserva como referencia, sin actividad." },
  };
  return map[status];
}
