"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, ViewTransition } from "react";
import { ArrowRight, BedDouble, Eye, MapPin, Pencil, Users } from "lucide-react";
import PropertyStatusBadge from "./PropertyStatusBadge";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { PropertySummary } from "@/types/property";

export default function PropertyCard({ property, onPause, onResume, onMarkRented, onArchive }: { property: PropertySummary; onPause: (id: number) => Promise<void>; onResume: (id: number) => Promise<void>; onMarkRented: (id: number) => Promise<void>; onArchive: (id: number) => Promise<void> }) {
  const [imageError, setImageError] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState("");
  async function run(action: (id: number) => Promise<void>) { if (actioning) return; setActioning(true); setError(""); try { await action(property.id); } catch (caught) { setError(getCommunityErrorMessage(caught, "No hemos podido actualizar el piso.")); } finally { setActioning(false); } }
  function runArchive() {
    if (!window.confirm(`¿Archivar "${property.title}"? Dejará de estar publicado y se cancelará su suscripción.`)) return;
    run(onArchive);
  }
  const location = property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city;
  const rent = property.total_monthly_rent === null ? "Precio por definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €/mes`;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-[#dddddd] bg-white shadow-[0_7px_24px_rgba(0,0,0,0.055)] sm:grid sm:grid-cols-[15.5rem_1fr]">
      <Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-forward"]} className="relative block aspect-[16/10] overflow-hidden bg-[#f3f3f3] sm:aspect-auto sm:min-h-57">
        <ViewTransition name={detailTransitionName("property", property.id)} share="coflow-detail-morph">
          <div className="relative h-full w-full overflow-hidden">
            {property.cover_image_url && !imageError ? <Image src={property.cover_image_url} alt={property.title} fill unoptimized onError={() => setImageError(true)} sizes="(min-width: 640px) 250px, 100vw" className="object-cover transition duration-500 hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center px-5 text-center text-sm font-medium text-[#717171]">Añade una foto de portada</div>}
          </div>
        </ViewTransition>
      </Link>
      <div className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 className="truncate text-xl font-semibold tracking-[-0.025em] text-[#191919] sm:text-2xl">{property.title}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-[#717171]"><MapPin className="h-4 w-4" />{location}</p></div><PropertyStatusBadge status={property.status} /></div>
        <p className="mt-4 text-xl font-semibold text-[#191919]">{rent}</p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#717171]"><span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" />{property.bedrooms} habitaciones</span><span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{property.max_tenants} plazas</span></div>
        {error ? <p className="mt-3 text-xs font-semibold text-red-600">{error}</p> : null}
        {property.status === "DRAFT" ? (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <Link href={`/propietarios/pisos/nuevo?draft=${property.id}`} className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold text-white">Continuar publicación<ArrowRight className="h-4 w-4" /></Link>
            <Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#cfcfcf] text-sm font-semibold text-[#191919]"><Pencil className="h-4 w-4" />Editar</Link>
          </div>
        ) : (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5"><Link href={`/propietarios/pisos/${property.id}`} transitionTypes={["nav-forward"]} className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#f5f5f5] text-sm font-semibold text-[#191919]"><Eye className="h-4 w-4" />Ver anuncio</Link><Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#cfcfcf] text-sm font-semibold text-[#191919]"><Pencil className="h-4 w-4" />Editar</Link></div>
        )}
        {property.status === "READY" ? <button type="button" disabled={actioning} onClick={() => run(onPause)} className="mt-2 text-xs font-semibold text-[#717171] underline">Pausar anuncio</button> : null}
        {property.status === "PAUSED" ? <button type="button" disabled={actioning} onClick={() => run(onResume)} className="mt-2 text-xs font-semibold underline">Reactivar anuncio</button> : null}
        {["READY", "PAUSED"].includes(property.status) ? <button type="button" disabled={actioning} onClick={() => run(onMarkRented)} className="mt-2 text-xs font-semibold text-[#717171] underline">Marcar como alquilado</button> : null}
        {property.status !== "ARCHIVED" ? <button type="button" disabled={actioning} onClick={runArchive} className="mt-2 text-xs font-semibold text-red-600 underline">Archivar piso</button> : null}
      </div>
    </article>
  );
}
