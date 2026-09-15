"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronLeft,
  CircleAlert,
  CircleCheck,
  Clock3,
  Euro,
  Layers,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Ruler,
  Sofa,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import PhotoDetailShell from "@/components/ui/PhotoDetailShell";
import PhotoGallery from "@/components/ui/PhotoGallery";
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-bold text-brand-dark">{TEAM_STATUS_LABELS[property.status]}</span>
          <span className="text-xs font-medium text-neutral-mid">{PROPERTY_TYPE_LABELS[property.property_type]}</span>
          <span className="text-xs font-medium text-neutral-mid">· Actualizada {formatRelative(property.updated_at)}</span>
        </div>
        <h1 className="mt-3 font-rounded text-4xl font-semibold tracking-[-0.045em] text-brand-dark sm:text-5xl">{property.title || "Sin título"}</h1>
        <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          {address || "Dirección pendiente"}
        </p>

        <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-card border border-border bg-surface sm:grid-cols-4 sm:divide-x sm:divide-border">
          <Stat icon={<WalletCards />} label="Al mes" value={formatEuros(property.total_monthly_rent)} />
          <Stat icon={<BedDouble />} label="Habitaciones" value={String(property.bedrooms)} />
          <Stat icon={<Bath />} label="Baños" value={String(property.bathrooms)} />
          <Stat icon={<Users />} label="Plazas" value={String(property.max_tenants)} />
        </div>

        <div className="mt-9 grid gap-3 border-t border-black/[0.07] pt-8 sm:grid-cols-[190px_1fr]">
          <h2 className="text-sm font-semibold uppercase tracking-[.12em] text-secondary">Descripción</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-secondary">{property.description || "Sin descripción todavía."}</p>
        </div>
        {property.amenities.length ? (
          <div className="mt-8 grid gap-3 border-t border-black/[0.07] pt-8 sm:grid-cols-[190px_1fr]">
            <h2 className="text-sm font-semibold uppercase tracking-[.12em] text-secondary">Equipamiento</h2>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <span key={amenity.id} className="rounded-full bg-surface-soft px-3 py-2 text-xs font-semibold text-brand-mid">{amenity.label}</span>
              ))}
            </div>
          </div>
        ) : null}
      </PhotoDetailShell>

      {actionError ? <p role="alert" className="mt-4 rounded-field bg-red-50 p-4 text-sm font-semibold text-red-700">{actionError}</p> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <section className="rounded-panel bg-surface p-5 shadow-soft sm:p-6">
          <p className="type-overline text-muted">Publicación</p>
          <h2 className="mt-1 font-rounded text-xl font-semibold text-brand-dark">
            {property.missing_fields.length ? "Faltan datos para publicar" : property.status === "READY" ? "Publicada y completa" : "Lista para publicar"}
          </h2>
          {property.missing_fields.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {property.missing_fields.map((field) => (
                <li key={field} className="flex items-center gap-2 text-sm font-semibold text-secondary first-letter:uppercase">
                  <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" /> {field}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary-dark">
              <CircleCheck className="h-4 w-4" /> Toda la información esencial está completa.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {canPublish && property.missing_fields.length === 0 ? (
              <button
                type="button"
                onClick={() => void publish()}
                disabled={publishing}
                className="press-control inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button disabled:opacity-50"
              >
                {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />} Publicar
              </button>
            ) : null}
            {editable ? (
              <Link
                href={`/equipo/alta-asistida?vivienda=${property.id}`}
                className="press-control inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-soft px-5 text-sm font-bold text-brand-dark"
              >
                <Pencil className="h-4 w-4" /> {property.missing_fields.length ? "Completar en el alta" : "Editar"}
              </Link>
            ) : null}
          </div>
        </section>

        <section className="rounded-panel bg-brand-dark p-5 text-white shadow-[0_16px_40px_rgba(20,55,41,.14)] sm:p-6">
          <p className="type-overline text-white/50">Cliente</p>
          <div className="mt-3 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10">
              <OwnerIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{owner.display_name}</p>
              <p className="mt-0.5 text-xs text-white/60">
                {OWNER_TYPE_LABELS[owner.owner_type]}
                {contactName && contactName !== owner.display_name ? ` · ${contactName}` : ""}
              </p>
              <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-bold ${owner.account_activated ? "bg-white/15 text-white" : "bg-amber-400/20 text-amber-100"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${owner.account_activated ? "bg-emerald-300" : "bg-amber-300"}`} />
                {owner.account_activated ? "Cuenta activada" : "Cuenta pendiente de activar"}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
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
            {!owner.email && !owner.phone ? <p className="text-xs text-white/60">Sin datos de contacto.</p> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            <Link href={`/equipo/viviendas?cliente=${owner.owner_profile_id}`} className="press-control inline-flex min-h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-bold text-white hover:bg-white/15">
              <Layers className="h-4 w-4" /> {owner.property_count ?? 0} {owner.property_count === 1 ? "vivienda" : "viviendas"}
            </Link>
            <Link href={`/equipo/alta-asistida?cliente=${owner.owner_profile_id}`} className="press-control inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand-dark">
              <Plus className="h-4 w-4" /> Añadir otra
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-panel bg-surface p-5 shadow-soft sm:p-6">
        <p className="type-overline text-muted">Ficha</p>
        <h2 className="mt-1 font-rounded text-xl font-semibold text-brand-dark">Condiciones y disponibilidad</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact icon={<CalendarDays />} label="Disponible desde" value={property.available_from ? formatDate(property.available_from) : "Sin indicar"} />
          <Fact icon={<Euro />} label="Fianza" value={property.deposit === null ? "Sin indicar" : property.deposit === 0 ? "Sin fianza" : formatEuros(property.deposit)} />
          <Fact icon={<Clock3 />} label="Estancia mínima" value={property.minimum_stay_months ? `${property.minimum_stay_months} ${property.minimum_stay_months === 1 ? "mes" : "meses"}` : "Sin mínimo"} />
          <Fact icon={<Ruler />} label="Superficie" value={property.surface_m2 ? `${property.surface_m2} m²` : "Sin indicar"} />
          <Fact icon={<Building2 />} label="Planta" value={[property.floor, property.has_elevator ? "con ascensor" : "sin ascensor"].filter(Boolean).join(" · ")} />
          <Fact icon={<Sofa />} label="Amueblada" value={property.furnished ? "Sí" : "No"} />
          <Fact icon={<WalletCards />} label="Gastos" value={property.utilities_included ? "Incluidos" : "No incluidos"} />
          <Fact icon={<Clock3 />} label="Alta" value={formatDate(property.created_at)} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
          <Rule label="Mascotas" value={property.pets_allowed} />
          <Rule label="Parejas" value={property.couples_allowed} />
          <Rule label="Estudiantes" value={property.students_allowed} />
          <Rule label="Empadronamiento" value={property.registration_allowed} />
          <Rule label="Fumar" value={property.smoking_allowed} />
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border-b border-border p-4 text-center sm:border-b-0">
      <span className="mx-auto block w-fit text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <strong className="mt-2 block font-rounded text-lg text-brand-dark">{value}</strong>
      <span className="mt-1 block text-xs text-secondary">{label}</span>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface-soft p-4">
      <span className="text-primary [&>svg]:h-4.5 [&>svg]:w-4.5">{icon}</span>
      <p className="mt-3 text-2xs font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-brand-dark">{value}</p>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: boolean | null }) {
  return (
    <span className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold ${value === true ? "bg-primary/[0.08] text-primary-dark" : value === false ? "bg-surface-soft text-secondary" : "border border-border text-muted"}`}>
      {label}: {value === true ? "Sí" : value === false ? "No" : "Sin definir"}
    </span>
  );
}

function ContactRow({ icon, href, label, external = false }: { icon: React.ReactNode; href: string; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex min-h-11 items-center gap-3 rounded-14 bg-white/[0.06] px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:text-white/60"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}
