"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bath, BedDouble, CalendarDays, CheckCircle2, ChevronLeft, CircleAlert, Clock3, Eye, Home, LoaderCircle, MapPin, Pencil, Ruler, Sofa, Users, WalletCards } from "lucide-react";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
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
  const { data: property, isLoading, isError, refetch } = useQuery({ queryKey, queryFn: () => getMyProperty(propertyId) });
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

  if (isLoading) return <PageSkeleton variant="community" />;
  if (isError || !property) return <ErrorState title="No pudimos abrir esta vivienda" description="Puede que ya no esté disponible o haya un problema de conexión." onRetry={() => void refetch()} action={<Link href="/propietarios/pisos" className="inline-flex h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Volver a mis viviendas</Link>} />;

  const orderedImages = [...property.images].sort((first, second) => {
    if (first.is_cover === second.is_cover) return first.position - second.position;
    return first.is_cover ? -1 : 1;
  });
  const missingItems = getMissingItems(property);
  const completeness = Math.round(((6 - missingItems.length) / 6) * 100);

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-4 pb-28 pt-4 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-6xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <PhotoDetailShell
        transitionName={detailTransitionName("property", property.id)}
        media={<PhotoGallery images={orderedImages.map((image, index) => ({ id: image.id, src: image.image_url, alt: `${property.title}, foto ${index + 1}` }))} priority empty={<div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-[#717171]">Añade una foto de portada</div>} />}
        actions={<><button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-brand-dark shadow-[0_3px_14px_rgba(0,0,0,0.14)] backdrop-blur"><ChevronLeft className="h-5 w-5" /></button><Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-[0_3px_14px_rgba(0,0,0,0.18)]"><Pencil className="h-4 w-4" />Editar</Link></>}
      >
        <div className="flex flex-wrap items-center gap-2"><PropertyStatusBadge status={property.status} /><span className="text-xs font-medium text-[#717171]">{TYPE_LABELS[property.property_type]}</span></div>
        <h1 className="mt-3 font-rounded text-[34px] font-semibold tracking-[-0.045em] text-brand-dark sm:text-[48px]">{property.title}</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-secondary"><MapPin className="h-4 w-4 text-primary" />{property.city}{property.neighborhood ? ` · ${property.neighborhood}` : ""}</p>
        <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-[20px] border border-border bg-surface sm:grid-cols-4 sm:divide-x sm:divide-border"><Stat icon={<WalletCards />} label="Al mes" value={property.total_monthly_rent === null ? "Sin definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`} /><Stat icon={<BedDouble />} label="Habitaciones" value={String(property.bedrooms)} /><Stat icon={<Bath />} label="Baños" value={String(property.bathrooms)} /><Stat icon={<Users />} label="Plazas" value={String(property.max_tenants)} /></div>
        <div className="mt-9 grid gap-3 border-t border-black/[0.07] pt-8 sm:grid-cols-[190px_1fr]"><h2 className="text-sm font-semibold uppercase tracking-[.12em] text-[#4f5f56]">Sobre la vivienda</h2><p className="whitespace-pre-line text-[15px] leading-7 text-[#66736d]">{property.description}</p></div>
        {property.amenities.length ? <div className="mt-8 grid gap-3 border-t border-black/[0.07] pt-8 sm:grid-cols-[190px_1fr]"><h2 className="text-sm font-semibold uppercase tracking-[.12em] text-[#4f5f56]">Lo que ofrece</h2><div className="flex flex-wrap gap-2">{property.amenities.map((amenity) => <span key={amenity.id} className="rounded-full bg-[#eaf0ec] px-3 py-2 text-xs font-semibold text-[#315f4b]">{amenity.label}</span>)}</div></div> : null}
      </PhotoDetailShell>
      {actionError ? <p role="alert" className="mt-4 rounded-[1rem] bg-red-50 p-4 text-sm font-semibold text-red-700">{actionError}</p> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <section className="rounded-[24px] border border-black/[0.05] bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Calidad del anuncio</p><h2 className="mt-1 font-rounded text-xl font-semibold text-brand-dark">{missingItems.length ? "Hay detalles por completar" : "Anuncio preparado"}</h2></div><span className="flex h-11 min-w-11 items-center justify-center rounded-full bg-mint-50 px-2 text-sm font-bold text-primary-dark">{completeness}%</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-soft"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} /></div>
          {missingItems.length ? <ul className="mt-4 grid gap-2 sm:grid-cols-2">{missingItems.map((item) => <li key={item} className="flex items-center gap-2 text-xs font-semibold text-secondary"><CircleAlert className="h-4 w-4 shrink-0 text-amber-600" />{item}</li>)}</ul> : <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary-dark"><CheckCircle2 className="h-4 w-4" /> La información esencial está completa.</p>}
          <Link href={`/propietarios/pisos/${property.id}/editar`} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white"><Pencil className="h-4 w-4" /> {missingItems.length ? "Completar información" : "Revisar anuncio"}</Link>
        </section>

        <section className="rounded-[24px] border border-black/[0.05] bg-brand-dark p-5 text-white shadow-[0_16px_40px_rgba(20,55,41,.14)] sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.13em] text-white/50">Siguiente paso</p><div className="mt-3 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"><Eye className="h-5 w-5" /></span><div><p className="text-sm font-bold">{statusTitle(property.status)}</p><p className="mt-1 text-xs leading-5 text-white/60">{statusDescription(property.status)}</p><p className="mt-2 text-[11px] font-semibold text-white/45">Actualizado {formatRelativeDate(property.updated_at)}</p></div></div>
          <div className="mt-5 flex flex-wrap gap-2">{property.status === "READY" ? <button type="button" disabled={actioning} onClick={() => run(() => pauseProperty(property.id))} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-bold text-white disabled:opacity-50">{actioning && <LoaderCircle className="h-4 w-4 animate-spin" />}Pausar</button> : null}{property.status === "PAUSED" ? <button type="button" disabled={actioning} onClick={() => run(() => resumeProperty(property.id))} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand-dark disabled:opacity-50">{actioning && <LoaderCircle className="h-4 w-4 animate-spin" />}Reactivar</button> : null}{["READY", "PAUSED"].includes(property.status) ? <button type="button" disabled={actioning} onClick={() => run(() => markPropertyRented(property.id))} className="min-h-11 rounded-full bg-white/10 px-4 text-sm font-bold text-white disabled:opacity-50">Marcar alquilada</button> : null}</div>
        </section>
      </div>

      <section className="mt-4 rounded-[26px] bg-surface p-5 shadow-soft sm:p-6">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Ficha operativa</p><h2 className="mt-1 font-rounded text-xl font-semibold text-brand-dark">Disponibilidad y condiciones</h2></div><Home className="h-5 w-5 text-primary" /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={<CalendarDays />} label="Disponible desde" value={property.available_from ? formatDate(property.available_from) : "Sin indicar"} />
          <Fact icon={<Clock3 />} label="Estancia mínima" value={property.minimum_stay_months ? `${property.minimum_stay_months} ${property.minimum_stay_months === 1 ? "mes" : "meses"}` : "Sin indicar"} />
          <Fact icon={<Ruler />} label="Superficie" value={property.surface_m2 ? `${property.surface_m2} m²` : "Sin indicar"} />
          <Fact icon={<Sofa />} label="Equipamiento" value={property.furnished ? "Amueblada" : "Sin amueblar"} />
        </div>
        <div className="mt-5 border-t border-border pt-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Condiciones</p><div className="mt-3 flex flex-wrap gap-2"><Rule label="Mascotas" value={property.pets_allowed} /><Rule label="Fumar" value={property.smoking_allowed} /><Rule label="Parejas" value={property.couples_allowed} /><Rule label="Estudiantes" value={property.students_allowed} /><Rule label="Empadronamiento" value={property.registration_allowed} /><Rule label="Gastos incluidos" value={property.utilities_included} /></div></div>
      </section>

    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="border-b border-border p-4 text-center sm:border-b-0"><span className="mx-auto block w-fit text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><strong className="mt-2 block font-rounded text-lg text-brand-dark">{value}</strong><span className="mt-1 block text-xs text-secondary">{label}</span></div>; }

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-[18px] bg-surface-soft p-4"><span className="text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span><p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</p><p className="mt-1 text-sm font-bold text-brand-dark">{value}</p></div>; }

function Rule({ label, value }: { label: string; value: boolean | null }) { return <span className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold ${value === true ? "bg-mint-50 text-primary-dark" : value === false ? "bg-surface-soft text-secondary" : "border border-border text-muted"}`}>{label}: {value === true ? "Sí" : value === false ? "No" : "Sin indicar"}</span>; }

function getMissingItems(property: Property) {
  return [
    property.images.length ? null : "Añade fotografías",
    property.description.trim().length >= 80 ? null : "Amplía la descripción",
    property.total_monthly_rent !== null ? null : "Define el precio",
    property.available_from ? null : "Indica la disponibilidad",
    property.amenities.length ? null : "Selecciona servicios",
    property.surface_m2 !== null ? null : "Añade la superficie",
  ].filter((item): item is string => Boolean(item));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function statusTitle(status: Property["status"]) {
  return ({ DRAFT: "Completa el anuncio", READY: "Preparada para el lanzamiento", PAUSED: "Decide cuándo reactivarla", PUBLISHED: "Anuncio publicado", RENTED: "Alquiler registrado", ARCHIVED: "Vivienda archivada" } as const)[status];
}

function statusDescription(status: Property["status"]) {
  return ({
    DRAFT: "Todavía faltan datos antes de dejar la vivienda preparada.",
    READY: "La información está guardada, pero la vivienda aún no se muestra públicamente.",
    PAUSED: "La actividad está detenida. Puedes reactivarla cuando vuelva a estar disponible.",
    PUBLISHED: "La vivienda está visible y puede recibir interés.",
    RENTED: "La vivienda permanece en tu cartera como alquilada.",
    ARCHIVED: "Se conserva como referencia y no tiene actividad.",
  } as const)[status];
}
