"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BedDouble, ChevronRight, MapPin, Users } from "lucide-react";
import PropertyStatusBadge from "./PropertyStatusBadge";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { PropertySummary } from "@/types/property";

export default function PropertyCard({
  property,
  onPause,
  onResume,
  onMarkRented,
}: {
  property: PropertySummary;
  onMarkReady: (id: number) => Promise<void>;
  onPause: (id: number) => Promise<void>;
  onResume: (id: number) => Promise<void>;
  onMarkRented: (id: number) => Promise<void>;
  onArchive: (id: number) => Promise<void>;
}) {
  const [imageError, setImageError] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [error, setError] = useState("");

  async function run(action: (id: number) => Promise<void>) {
    if (actioning) return;
    setActioning(true);
    setError("");
    try {
      await action(property.id);
    } catch (caught) {
      setError(getCommunityErrorMessage(caught, "No hemos podido actualizar el piso."));
    } finally {
      setActioning(false);
    }
  }

  const location = property.neighborhood
    ? `${property.neighborhood}, ${property.city}`
    : property.city;

  return (
    <article className="group overflow-hidden rounded-24 border border-border bg-surface shadow-soft transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(26,55,43,0.1)]">
      <Link href={`/propietarios/pisos/${property.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#f2f1ed]">
          {property.cover_image_url && !imageError ? (
            <Image
              src={property.cover_image_url}
              alt={property.title}
              fill
              unoptimized
              onError={() => setImageError(true)}
              sizes="(min-width: 1024px) 32vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-secondary">
              Añade una foto de portada
            </div>
          )}
          <div className="absolute left-4 top-4"><PropertyStatusBadge status={property.status} /></div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-brand-dark">{property.title}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-secondary"><MapPin className="h-4 w-4" />{location}</p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-secondary" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-secondary">
            <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-primary" />{property.bedrooms} habitaciones</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{property.max_tenants} plazas</span>
            {property.total_monthly_rent !== null ? <span className="ml-auto font-bold text-brand-dark">{property.total_monthly_rent.toLocaleString("es-ES")} €/mes</span> : null}
          </div>
        </div>
      </Link>

      {error ? <p className="px-5 pb-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {["READY", "PAUSED"].includes(property.status) ? (
        <div className="flex gap-2 border-t border-border px-5 py-4">
          {property.status === "READY" ? <button type="button" disabled={actioning} onClick={() => run(onPause)} className="h-10 flex-1 rounded-full border border-border text-sm font-bold text-brand-dark disabled:opacity-50">Pausar</button> : <button type="button" disabled={actioning} onClick={() => run(onResume)} className="h-10 flex-1 rounded-full border border-border text-sm font-bold text-brand-dark disabled:opacity-50">Reactivar</button>}
          <button type="button" disabled={actioning} onClick={() => run(onMarkRented)} className="h-10 flex-1 rounded-full bg-brand text-sm font-bold text-white disabled:opacity-50">Alquilado</button>
        </div>
      ) : null}
    </article>
  );
}
