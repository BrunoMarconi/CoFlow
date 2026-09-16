"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, CircleAlert, KeyRound, LoaderCircle, MapPin, Pause, Pencil, Play } from "lucide-react";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import PhotoDetailShell from "@/components/ui/PhotoDetailShell";
import PhotoGallery from "@/components/ui/PhotoGallery";
import {
  DataRow,
  DetailSection,
  SidePanel,
  StatusDot,
  statusTone,
} from "@/components/propietario/DetailPrimitives";
import { getMyProperty, markPropertyRented, pauseProperty, resumeProperty } from "@/services/properties";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { Property } from "@/types/property";

const TYPE_LABELS: Record<string, string> = { APARTMENT: "Piso", HOUSE: "Casa", STUDIO: "Estudio", SHARED_APARTMENT: "Piso compartido", OTHER: "Vivienda" };

const STATUS_LABELS: Record<Property["status"], string> = {
  DRAFT: "Borrador",
  READY: "Preparada",
  PAUSED: "Pausada",
  PUBLISHED: "Publicada",
  RENTED: "Alquilada",
  ARCHIVED: "Archivada",
};

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
  const address = [property.address_line, property.postal_code, property.neighborhood, property.city].filter(Boolean).join(" · ");

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-4 pb-28 pt-4 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-6xl sm:rounded-sheet sm:p-7 lg:p-8">
      <PhotoDetailShell
        transitionName={detailTransitionName("property", property.id)}
        mediaClassName="h-[38svh] min-h-[15rem] sm:h-[26rem]"
        media={<PhotoGallery images={orderedImages.map((image, index) => ({ id: image.id, src: image.image_url, alt: `${property.title}, foto ${index + 1}` }))} priority empty={<div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-neutral-mid">Añade una foto de portada</div>} />}
        actions={<><button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-brand-dark shadow-card backdrop-blur"><ChevronLeft className="h-5 w-5" /></button><Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-raised"><Pencil className="h-4 w-4" />Editar</Link></>}
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-medium text-neutral-mid">
          <StatusDot tone={statusTone(property.status)} label={STATUS_LABELS[property.status]} />
          <span aria-hidden="true">·</span>
          <span>{TYPE_LABELS[property.property_type]}</span>
          <span aria-hidden="true">·</span>
          <span>Actualizada {formatRelativeDate(property.updated_at)}</span>
        </div>
        <h1 className="mt-3 font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">{property.title}</h1>
        <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {address || "Dirección pendiente"}
        </p>

        <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-10">
          <div className="@container min-w-0">
            <DetailSection title="Resumen" first>
              <dl className="grid gap-x-8 @lg:grid-cols-2">
                <DataRow label="Tipo" value={TYPE_LABELS[property.property_type]} />
                <DataRow label="Superficie" value={property.surface_m2 ? `${property.surface_m2} m²` : null} />
                <DataRow label="Habitaciones" value={String(property.bedrooms)} />
                <DataRow label="Baños" value={String(property.bathrooms)} />
                <DataRow label="Plazas" value={`${property.max_tenants} ${property.max_tenants === 1 ? "persona" : "personas"}`} />
                <DataRow label="Planta" value={[property.floor, property.has_elevator ? "con ascensor" : "sin ascensor"].filter(Boolean).join(" · ")} />
                <DataRow label="Amueblada" value={property.furnished ? "Sí" : "No"} />
                <DataRow label="Gastos" value={property.utilities_included ? "Incluidos" : "No incluidos"} />
              </dl>
            </DetailSection>

            <DetailSection title="Sobre la vivienda">
              <p className="whitespace-pre-line text-sm leading-7 text-secondary">{property.description || "Sin descripción todavía."}</p>
            </DetailSection>

            {property.amenities.length ? (
              <DetailSection title="Lo que ofrece">
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => <span key={amenity.id} className="rounded-full bg-surface-soft px-3 py-2 text-xs font-semibold text-brand-mid">{amenity.label}</span>)}
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title="Disponibilidad y condiciones">
              <dl className="grid gap-x-8 @lg:grid-cols-2">
                <DataRow label="Disponible desde" value={property.available_from ? formatDate(property.available_from) : null} />
                <DataRow label="Estancia mínima" value={property.minimum_stay_months ? `${property.minimum_stay_months} ${property.minimum_stay_months === 1 ? "mes" : "meses"}` : "Sin mínimo"} />
                <DataRow label="Fianza" value={property.deposit === null ? null : property.deposit === 0 ? "Sin fianza" : `${property.deposit.toLocaleString("es-ES")} €`} />
                <DataRow label="Alta en CoFlow" value={formatDate(property.created_at)} />
              </dl>
            </DetailSection>

            <DetailSection title="Normas de la vivienda">
              <dl className="grid gap-x-8 @lg:grid-cols-2">
                <DataRow label="Mascotas" value={ruleValue(property.pets_allowed)} tone={ruleTone(property.pets_allowed)} />
                <DataRow label="Parejas" value={ruleValue(property.couples_allowed)} tone={ruleTone(property.couples_allowed)} />
                <DataRow label="Estudiantes" value={ruleValue(property.students_allowed)} tone={ruleTone(property.students_allowed)} />
                <DataRow label="Empadronamiento" value={ruleValue(property.registration_allowed)} tone={ruleTone(property.registration_allowed)} />
                <DataRow label="Fumar" value={ruleValue(property.smoking_allowed)} tone={ruleTone(property.smoking_allowed)} />
              </dl>
            </DetailSection>
          </div>

          <aside className="order-first grid gap-3 xl:order-0 xl:sticky xl:top-[calc(var(--mobile-header-height)+var(--safe-top)+1.25rem)]">
            <SidePanel>
              <p className="type-overline text-muted">Alquiler</p>
              <p className="mt-1.5 flex items-baseline gap-1.5">
                <strong className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark">{property.total_monthly_rent === null ? "Sin definir" : `${property.total_monthly_rent.toLocaleString("es-ES")} €`}</strong>
                {property.total_monthly_rent === null ? null : <span className="text-sm font-semibold text-secondary">/ mes</span>}
              </p>
              <p className="mt-1 text-xs text-secondary">{property.utilities_included ? "Gastos incluidos" : "Gastos no incluidos"}</p>

              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-bold text-brand-dark">{missingItems.length ? "Detalles por completar" : "Anuncio preparado"}</p>
                  <span className="text-sm font-bold tabular-nums text-primary-dark">{completeness}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100} aria-label="Calidad del anuncio">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} />
                </div>
                {missingItems.length ? (
                  <ul className="mt-3 grid gap-1.5">
                    {missingItems.map((item) => (
                      <li key={item} className="flex gap-2 text-xs font-semibold text-secondary">
                        <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary-dark">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> La información esencial está completa.
                  </p>
                )}

                <Link href={`/propietarios/pisos/${property.id}/editar`} transitionTypes={["nav-forward"]} className="press-control mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white shadow-button">
                  <Pencil className="h-4 w-4" /> {missingItems.length ? "Completar información" : "Editar anuncio"}
                </Link>
              </div>
            </SidePanel>

            <SidePanel>
              <p className="type-overline text-muted">Estado</p>
              <p className="mt-1.5 text-sm font-bold text-brand-dark">{statusTitle(property.status)}</p>
              <p className="mt-1 text-xs leading-5 text-secondary">{statusDescription(property.status)}</p>

              {["READY", "PAUSED"].includes(property.status) ? (
                <div className="mt-4 grid gap-2 border-t border-border pt-4">
                  {property.status === "READY" ? (
                    <button type="button" disabled={actioning} onClick={() => run(() => pauseProperty(property.id))} className="press-control inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-soft px-4 text-sm font-bold text-brand-dark disabled:opacity-50">
                      {actioning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />} Pausar anuncio
                    </button>
                  ) : (
                    <button type="button" disabled={actioning} onClick={() => run(() => resumeProperty(property.id))} className="press-control inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-soft px-4 text-sm font-bold text-brand-dark disabled:opacity-50">
                      {actioning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Reactivar anuncio
                    </button>
                  )}
                  <button type="button" disabled={actioning} onClick={() => run(() => markPropertyRented(property.id))} className="press-control inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-soft px-4 text-sm font-bold text-brand-dark disabled:opacity-50">
                    <KeyRound className="h-4 w-4" /> Marcar alquilada
                  </button>
                </div>
              ) : null}

              {actionError ? <p role="alert" className="mt-3 rounded-10 bg-red-50 p-3 text-xs font-semibold text-red-700">{actionError}</p> : null}
            </SidePanel>
          </aside>
        </div>
      </PhotoDetailShell>
    </div>
  );
}

function ruleValue(value: boolean | null) {
  if (value === true) return "Sí";
  if (value === false) return "No";
  return null;
}

function ruleTone(value: boolean | null) {
  return value === true ? ("positive" as const) : undefined;
}

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
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
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
