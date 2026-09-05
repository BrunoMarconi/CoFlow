"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bath, BedDouble, ChevronLeft, MapPin, Pencil, Share2, Users, WalletCards } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import PhotoDetailShell from "@/components/ui/PhotoDetailShell";
import PhotoGallery from "@/components/ui/PhotoGallery";
import PropertyStatusBadge from "@/components/propietario/PropertyStatusBadge";
import { getMyProperty, markPropertyRented, pauseProperty, resumeProperty } from "@/services/properties";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { Property } from "@/types/property";

const TYPE_LABELS: Record<string, string> = { APARTMENT: "Piso", HOUSE: "Casa", STUDIO: "Estudio", SHARED_APARTMENT: "Piso compartido", OTHER: "Vivienda" };

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  const queryClient = useQueryClient();
  const queryKey = ["my-property", propertyId];
  const { data: property, isLoading, isError } = useQuery({ queryKey, queryFn: () => getMyProperty(propertyId) });
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
      setActionError(getCommunityErrorMessage(error, "No hemos podido completar la acción."));
    } finally {
      setActioning(false);
    }
  }

  if (isLoading) return <div className="flex min-h-[45vh] items-center justify-center"><Spinner /></div>;
  if (isError || !property) return <section className="mx-auto max-w-2xl rounded-[1.5rem] border border-[#dddddd] bg-white p-10 text-center"><h1 className="text-2xl font-semibold">No hemos encontrado este piso</h1><Link href="/propietarios/pisos" className="mt-6 inline-flex h-12 items-center rounded-full bg-black px-6 font-semibold text-white">Volver a mis pisos</Link></section>;

  const orderedImages = [...property.images].sort((first, second) => {
    if (first.is_cover === second.is_cover) return first.position - second.position;
    return first.is_cover ? -1 : 1;
  });

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <PhotoDetailShell
        transitionName={detailTransitionName("property", property.id)}
        media={<PhotoGallery images={orderedImages.map((image, index) => ({ id: image.id, src: image.image_url, alt: `${property.title}, foto ${index + 1}` }))} priority empty={<div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#717171]">Añade una foto de portada</div>} />}
        actions={<><button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#191919] shadow-[0_3px_14px_rgba(0,0,0,0.14)] backdrop-blur"><ChevronLeft className="h-6 w-6" /></button><div className="flex gap-2"><button type="button" onClick={() => navigator.share?.({ title: property.title, url: window.location.href })} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#191919] shadow-[0_3px_14px_rgba(0,0,0,0.14)] backdrop-blur" aria-label="Compartir"><Share2 className="h-5 w-5" /></button><Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-[0_3px_14px_rgba(0,0,0,0.18)]"><Pencil className="h-4 w-4" />Editar</Link></div></>}
      >
        <div className="flex flex-wrap items-center gap-2"><PropertyStatusBadge status={property.status} /><span className="text-xs font-medium text-[#717171]">{TYPE_LABELS[property.property_type]}</span></div>
        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.045em] text-[#17392c] sm:text-[48px]">{property.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-[#717171]"><MapPin className="h-4 w-4" />{property.city}{property.neighborhood ? ` · ${property.neighborhood}` : ""}</p>
        <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-[20px] border border-black/[0.07] sm:grid-cols-4 sm:divide-x sm:divide-black/[0.06]"><Stat icon={<WalletCards />} label="Al mes" value={property.total_monthly_rent === null ? "Sin definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`} /><Stat icon={<BedDouble />} label="Habitaciones" value={String(property.bedrooms)} /><Stat icon={<Bath />} label="Baños" value={String(property.bathrooms)} /><Stat icon={<Users />} label="Plazas" value={String(property.max_tenants)} /></div>
        <div className="mt-9 grid gap-3 border-t border-black/[0.07] pt-8 sm:grid-cols-[190px_1fr]"><h2 className="text-sm font-semibold uppercase tracking-[.12em] text-[#4f5f56]">Sobre la vivienda</h2><p className="whitespace-pre-line text-[15px] leading-7 text-[#66736d]">{property.description}</p></div>
        {property.amenities.length ? <div className="mt-8 grid gap-3 border-t border-black/[0.07] pt-8 sm:grid-cols-[190px_1fr]"><h2 className="text-sm font-semibold uppercase tracking-[.12em] text-[#4f5f56]">Lo que ofrece</h2><div className="flex flex-wrap gap-2">{property.amenities.map((amenity) => <span key={amenity.id} className="rounded-full bg-[#eaf0ec] px-3 py-2 text-xs font-semibold text-[#315f4b]">{amenity.label}</span>)}</div></div> : null}
      </PhotoDetailShell>
      {actionError ? <p role="alert" className="mt-4 rounded-[1rem] bg-red-50 p-4 text-sm font-semibold text-red-700">{actionError}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">{["READY", "PUBLISHED"].includes(property.status) ? <button type="button" disabled={actioning} onClick={() => run(() => pauseProperty(property.id))} className="h-12 rounded-full border border-[#cfcfcf] bg-white px-6 font-semibold disabled:opacity-50">Pausar anuncio</button> : null}{property.status === "PAUSED" ? <button type="button" disabled={actioning} onClick={() => run(() => resumeProperty(property.id))} className="h-12 rounded-full bg-black px-6 font-semibold text-white disabled:opacity-50">Reactivar anuncio</button> : null}{["READY", "PUBLISHED", "PAUSED"].includes(property.status) ? <button type="button" disabled={actioning} onClick={() => run(() => markPropertyRented(property.id))} className="h-12 rounded-full border border-[#cfcfcf] bg-white px-6 font-semibold disabled:opacity-50">Marcar como alquilado</button> : null}</div>

    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="border-b border-black/[0.06] p-4 text-center sm:border-b-0"><span className="mx-auto block w-fit text-[#315f4b] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><strong className="mt-2 block text-lg text-[#17392c]">{value}</strong><span className="mt-1 block text-xs text-[#748078]">{label}</span></div>; }
