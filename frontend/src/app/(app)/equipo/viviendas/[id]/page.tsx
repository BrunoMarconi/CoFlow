"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Layers,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import PhotoDetailShell from "@/components/ui/PhotoDetailShell";
import PhotoGallery from "@/components/ui/PhotoGallery";
import {
  DataRow,
  DetailSection,
  SidePanel,
  StatusDot,
  statusTone,
} from "@/components/propietario/DetailPrimitives";
import { getTeamProperty, markTeamPropertyReady } from "@/services/team";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { detailTransitionName } from "@/lib/detailTransitions";
import {
  EDITABLE_STATUSES,
  OWNER_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  TEAM_STATUS_LABELS,
  formatDate,
  formatEuros,
  formatRelative,
  whatsappHref,
} from "@/lib/teamListing";

export default function TeamPropertyDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  const queryClient = useQueryClient();
  const { data: property, isPending, isError, refetch } = useQuery({
    queryKey: ["team-property", propertyId],
    queryFn: () => getTeamProperty(propertyId),
    enabled: Number.isInteger(propertyId) && propertyId > 0,
  });
  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState("");

  async function publish() {
    if (!property || publishing) return;
    setPublishing(true);
    setActionError("");
    try {
      const updated = await markTeamPropertyReady(property.id);
      queryClient.setQueryData(["team-property", property.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["team-properties"] });
    } catch (error) {
      setActionError(getCommunityErrorMessage(error, "No hemos podido publicar la vivienda."));
    } finally {
      setPublishing(false);
    }
  }

  if (isPending) return <PageSkeleton variant="community" />;
  if (isError || !property) {
    return (
      <ErrorState
        title="No pudimos abrir esta vivienda"
        description="Puede que ya no exista o que haya un problema de conexión."
        onRetry={() => void refetch()}
        action={<Link href="/equipo/viviendas" className="inline-flex h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Todas las viviendas</Link>}
      />
    );
  }

  const owner = property.owner;
  const editable = EDITABLE_STATUSES.includes(property.status);
  const canPublish = property.status === "DRAFT" || property.status === "PAUSED";
  const images = [...property.images].sort((a, b) => (a.is_cover === b.is_cover ? a.position - b.position : a.is_cover ? -1 : 1));
  const OwnerIcon = owner.owner_type === "INDIVIDUAL" ? UserRound : Building2;
  const contactName = [owner.first_name, owner.last_name].filter((part) => part && part !== "Propietario").join(" ");
  const address = [property.address_line, property.postal_code, property.neighborhood, property.city].filter(Boolean).join(" · ");

  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-4 pb-28 pt-4 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-6xl sm:rounded-sheet sm:p-7 lg:p-8">
      <PhotoDetailShell
        transitionName={detailTransitionName("property", property.id)}
        /* Ficha de gestión, no escaparate: la portada sigue abriendo la
         * pantalla, pero a media altura se llega a los datos sin un
         * scroll de por medio — que es a lo que se entra aquí. */
        mediaClassName="h-[38svh] min-h-[15rem] sm:h-[26rem]"
        media={
          <PhotoGallery
            images={images.map((image, index) => ({ id: image.id, src: image.image_url, alt: `${property.title}, foto ${index + 1}` }))}
            priority
            empty={<div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-neutral-mid">Esta vivienda aún no tiene fotos</div>}
          />
        }
        actions={
          <>
            <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-brand-dark shadow-card backdrop-blur">
              <ChevronLeft className="h-5 w-5" />
            </button>
            {editable ? (
              <Link href={`/equipo/alta-asistida?vivienda=${property.id}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-raised">
                <Pencil className="h-4 w-4" /> Editar
              </Link>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-medium text-neutral-mid">
          <StatusDot tone={statusTone(property.status)} label={TEAM_STATUS_LABELS[property.status]} />
          <span aria-hidden="true">·</span>
          <span>{PROPERTY_TYPE_LABELS[property.property_type]}</span>
          <span aria-hidden="true">·</span>
          <span>Actualizada {formatRelative(property.updated_at)}</span>
        </div>
        <h1 className="mt-3 font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">{property.title || "Sin título"}</h1>
        <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {address || "Dirección pendiente"}
        </p>

        <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-10">
          <div className="@container min-w-0">
            <DetailSection title="Resumen" first>
              <dl className="grid gap-x-8 @lg:grid-cols-2">
                <DataRow label="Tipo" value={PROPERTY_TYPE_LABELS[property.property_type]} />
                <DataRow label="Superficie" value={property.surface_m2 ? `${property.surface_m2} m²` : null} />
                <DataRow label="Habitaciones" value={String(property.bedrooms)} />
                <DataRow label="Baños" value={String(property.bathrooms)} />
                <DataRow label="Plazas" value={`${property.max_tenants} ${property.max_tenants === 1 ? "persona" : "personas"}`} />
                <DataRow label="Planta" value={[property.floor, property.has_elevator ? "con ascensor" : "sin ascensor"].filter(Boolean).join(" · ")} />
                <DataRow label="Amueblada" value={property.furnished ? "Sí" : "No"} />
                <DataRow label="Gastos" value={property.utilities_included ? "Incluidos" : "No incluidos"} />
              </dl>
            </DetailSection>

            <DetailSection title="Descripción">
              <p className="whitespace-pre-line text-sm leading-7 text-secondary">{property.description || "Sin descripción todavía."}</p>
            </DetailSection>

            {property.amenities.length ? (
              <DetailSection title="Equipamiento">
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <span key={amenity.id} className="rounded-full bg-surface-soft px-3 py-2 text-xs font-semibold text-brand-mid">{amenity.label}</span>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            <DetailSection title="Disponibilidad y condiciones">
              <dl className="grid gap-x-8 @lg:grid-cols-2">
                <DataRow label="Disponible desde" value={property.available_from ? formatDate(property.available_from) : null} />
                <DataRow label="Estancia mínima" value={property.minimum_stay_months ? `${property.minimum_stay_months} ${property.minimum_stay_months === 1 ? "mes" : "meses"}` : "Sin mínimo"} />
                <DataRow label="Fianza" value={property.deposit === null ? null : property.deposit === 0 ? "Sin fianza" : formatEuros(property.deposit)} />
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

          {/* En móvil sube justo debajo del título: el precio, lo que falta
           * y a quién llamar es a lo que se entra. En escritorio se queda
           * fijo mientras se recorre el resto de la ficha. */}
          <aside className="order-first grid gap-3 xl:order-0 xl:sticky xl:top-[calc(var(--mobile-header-height)+var(--safe-top)+1.25rem)]">
            <SidePanel>
              <p className="type-overline text-muted">Alquiler</p>
              <p className="mt-1.5 flex items-baseline gap-1.5">
                <strong className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark">{formatEuros(property.total_monthly_rent)}</strong>
                {property.total_monthly_rent === null ? null : <span className="text-sm font-semibold text-secondary">/ mes</span>}
              </p>
              <p className="mt-1 text-xs text-secondary">
                {property.utilities_included ? "Gastos incluidos" : "Gastos no incluidos"}
                {property.deposit ? ` · Fianza ${formatEuros(property.deposit)}` : ""}
              </p>

              <div className="mt-4 border-t border-border pt-4">
                {property.missing_fields.length ? (
                  <>
                    <p className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                      <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" /> Faltan datos para publicar
                    </p>
                    <ul className="mt-2.5 grid gap-1.5">
                      {property.missing_fields.map((field) => (
                        <li key={field} className="flex gap-2 text-xs font-semibold text-secondary first-letter:uppercase">
                          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          {field}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="flex items-center gap-2 text-sm font-bold text-primary-dark">
                    <CircleCheck className="h-4 w-4 shrink-0" /> Ficha completa
                  </p>
                )}

                {canPublish && property.missing_fields.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => void publish()}
                    disabled={publishing}
                    className="press-control mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button disabled:opacity-50"
                  >
                    {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />} Publicar
                  </button>
                ) : null}
                {editable ? (
                  <Link
                    href={`/equipo/alta-asistida?vivienda=${property.id}`}
                    className="press-control mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-surface-soft px-5 text-sm font-bold text-brand-dark"
                  >
                    <Pencil className="h-4 w-4" /> {property.missing_fields.length ? "Completar en el alta" : "Editar ficha"}
                  </Link>
                ) : null}
                {actionError ? <p role="alert" className="mt-3 rounded-10 bg-red-50 p-3 text-xs font-semibold text-red-700">{actionError}</p> : null}
              </div>
            </SidePanel>

            <SidePanel>
              <p className="type-overline text-muted">Cliente</p>
              <div className="mt-3 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
                  <OwnerIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-brand-dark">{owner.display_name}</p>
                  <p className="mt-0.5 text-xs text-secondary">
                    {OWNER_TYPE_LABELS[owner.owner_type]}
                    {contactName && contactName !== owner.display_name ? ` · ${contactName}` : ""}
                  </p>
                  <p className="mt-1.5">
                    <StatusDot
                      tone={owner.account_activated ? "positive" : "pending"}
                      label={owner.account_activated ? "Cuenta activada" : "Cuenta sin activar"}
                    />
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-border pt-2">
                {owner.email ? <ContactRow icon={<Mail />} href={`mailto:${owner.email}`} label={owner.email} /> : null}
                {owner.phone ? <ContactRow icon={<Phone />} href={`tel:${owner.phone.replace(/\s/g, "")}`} label={owner.phone} /> : null}
                {owner.phone ? (
                  <ContactRow
                    icon={<MessageCircle />}
                    href={whatsappHref(owner.phone, `Hola, te escribimos de CoFlow sobre la vivienda «${property.title}».`)}
                    label="Escribir por WhatsApp"
                    external
                  />
                ) : null}
                {!owner.email && !owner.phone ? <p className="py-2 text-xs text-muted">Sin datos de contacto.</p> : null}
              </div>

              <div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-3">
                <Link href={`/equipo/viviendas?cliente=${owner.owner_profile_id}`} className="press-control inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-soft px-3.5 text-xs font-bold text-brand-dark">
                  <Layers className="h-3.5 w-3.5" /> {owner.property_count ?? 0} {owner.property_count === 1 ? "vivienda" : "viviendas"}
                </Link>
                <Link href={`/equipo/alta-asistida?cliente=${owner.owner_profile_id}`} className="press-control inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-soft px-3.5 text-xs font-bold text-brand-dark">
                  <Plus className="h-3.5 w-3.5" /> Añadir otra
                </Link>
              </div>
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

function ContactRow({ icon, href, label, external = false }: { icon: React.ReactNode; href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-10 px-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-surface-soft [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-primary"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}
