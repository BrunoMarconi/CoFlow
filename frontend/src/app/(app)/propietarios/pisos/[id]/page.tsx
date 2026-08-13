"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  ChevronLeft,
  MapPin,
  Pencil,
  Users,
  WalletCards,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import PropertyStatusBadge from "@/components/propietario/PropertyStatusBadge";
import {
  getMyProperty,
  markPropertyRented,
  pauseProperty,
  resumeProperty,
} from "@/services/properties";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { Property } from "@/types/property";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Piso",
  HOUSE: "Casa",
  STUDIO: "Estudio",
  SHARED_APARTMENT: "Piso compartido",
  OTHER: "Vivienda",
};

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  const queryClient = useQueryClient();
  const queryKey = ["my-property", propertyId];
  const { data: property, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getMyProperty(propertyId),
  });
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState("");

  async function run(action: () => Promise<Property>) {
    if (actioning) return;
    setActioning(true);
    setActionError("");
    try {
      const updated = await action();
      queryClient.setQueryData(queryKey, updated);
      await queryClient.invalidateQueries({ queryKey: ["my-properties"] });
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(error, "No hemos podido completar la acción.")
      );
    } finally {
      setActioning(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;
  }

  if (isError || !property) {
    return (
      <section className="mx-auto max-w-2xl rounded-24 border border-border bg-surface p-10 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-brand-dark">No hemos encontrado este piso</h1>
        <Link href="/propietarios/pisos" className="mt-6 inline-flex h-12 items-center rounded-full bg-brand px-6 font-bold text-white">Volver a mis pisos</Link>
      </section>
    );
  }

  const cover = property.images.find((image) => image.is_cover) ?? property.images[0];
  const gallery = property.images.filter((image) => image.id !== cover?.id).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/propietarios/pisos" aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-soft"><ChevronLeft className="h-6 w-6" /></Link>
        <Link href={`/propietarios/pisos/${property.id}/editar`} className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-5 text-sm font-bold text-brand-dark shadow-soft"><Pencil className="h-4 w-4" />Editar</Link>
      </div>

      <section className="mt-5 overflow-hidden rounded-24 border border-border bg-surface shadow-soft">
        {cover ? (
          <div className="grid gap-1 sm:grid-cols-[1.5fr_1fr]">
            <div className="relative aspect-[16/10] sm:aspect-auto sm:min-h-96"><Image src={cover.image_url} alt={property.title} fill unoptimized sizes="(min-width: 768px) 62vw, 100vw" className="object-cover" /></div>
            <div className="hidden grid-cols-2 gap-1 sm:grid">
              {gallery.map((image) => <div key={image.id} className="relative min-h-44"><Image src={image.image_url} alt="" fill unoptimized sizes="20vw" className="object-cover" /></div>)}
            </div>
          </div>
        ) : <div className="flex aspect-[16/8] items-center justify-center bg-surface-soft text-secondary">Añade una foto de portada</div>}

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><PropertyStatusBadge status={property.status} /><span className="text-xs font-semibold text-secondary">{PROPERTY_TYPE_LABELS[property.property_type]}</span></div>
          <h1 className="mt-3 font-rounded text-3xl font-bold tracking-[-0.035em] text-brand-dark sm:text-5xl">{property.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-secondary"><MapPin className="h-4 w-4 text-primary" />{property.city}{property.neighborhood ? ` · ${property.neighborhood}` : ""}</p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<WalletCards />} label="Al mes" value={property.total_monthly_rent === null ? "Sin definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`} />
            <Stat icon={<BedDouble />} label="Habitaciones" value={String(property.bedrooms)} />
            <Stat icon={<Bath />} label="Baños" value={String(property.bathrooms)} />
            <Stat icon={<Users />} label="Plazas" value={String(property.max_tenants)} />
          </div>

          <div className="mt-8 border-t border-border pt-7"><h2 className="text-xl font-bold text-brand-dark">Sobre la vivienda</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-secondary">{property.description}</p></div>
          {property.amenities.length ? <div className="mt-7 flex flex-wrap gap-2">{property.amenities.map((amenity) => <span key={amenity.id} className="rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-brand-dark">{amenity.label}</span>)}</div> : null}
        </div>
      </section>

      {actionError ? <p role="alert" className="mt-4 rounded-18 border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{actionError}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {property.status === "READY" || property.status === "PUBLISHED" ? <button type="button" disabled={actioning} onClick={() => run(() => pauseProperty(property.id))} className="h-12 rounded-full border border-border bg-surface px-6 font-bold text-brand-dark shadow-soft disabled:opacity-50">Pausar anuncio</button> : null}
        {property.status === "PAUSED" ? <button type="button" disabled={actioning} onClick={() => run(() => resumeProperty(property.id))} className="h-12 rounded-full bg-brand px-6 font-bold text-white disabled:opacity-50">Reactivar anuncio</button> : null}
        {["READY", "PUBLISHED", "PAUSED"].includes(property.status) ? <button type="button" disabled={actioning} onClick={() => run(() => markPropertyRented(property.id))} className="h-12 rounded-full border border-border bg-surface px-6 font-bold text-brand-dark shadow-soft disabled:opacity-50">Marcar como alquilado</button> : null}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-18 border border-border p-4"><span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><strong className="mt-3 block text-lg text-brand-dark">{value}</strong><span className="mt-1 block text-xs text-secondary">{label}</span></div>;
}
