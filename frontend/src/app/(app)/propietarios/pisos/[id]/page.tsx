"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Spinner from "@/components/ui/Spinner";
import PropertyStatusBadge from "@/components/propietario/PropertyStatusBadge";
import {
  archiveProperty,
  getMyProperty,
  markPropertyReady,
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
  SHARED_APARTMENT: "Piso preparado para compartir",
  OTHER: "Otro",
};

export default function PropiedadDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const propertyId = Number(params.id);

  const queryClient = useQueryClient();
  const propertyQueryKey = ["my-property", propertyId];

  const {
    data: property = null,
    isLoading: loading,
    isError: notFound,
  } = useQuery({
    queryKey: propertyQueryKey,
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
      queryClient.setQueryData(propertyQueryKey, updated);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "No pudimos completar la acción. Inténtalo de nuevo."
        )
      );
    } finally {
      setActioning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          No hemos encontrado este piso
        </h1>

        <Link
          href="/propietarios/pisos"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white"
        >
          Volver a mis pisos
        </Link>
      </div>
    );
  }

  const cover =
    property.images.find((image) => image.is_cover) ?? property.images[0];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PropertyStatusBadge status={property.status} />
            <span className="text-xs font-semibold text-muted">
              {PROPERTY_TYPE_LABELS[property.property_type]}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {property.title}
          </h1>

          <p className="mt-1 text-sm text-muted">
            {property.address_line}, {property.city} ({property.province})
          </p>
        </div>

        {(property.status === "DRAFT" ||
          property.status === "READY" ||
          property.status === "PAUSED") && (
          <Link
            href={`/propietarios/pisos/${property.id}/editar`}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-line bg-surface px-5 text-sm font-bold text-foreground transition hover:bg-surface-soft"
          >
            Editar
          </Link>
        )}
      </div>

      {cover && (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {property.images.map((image) => (
            <div
              key={image.id}
              className="relative h-28 w-full overflow-hidden rounded-2xl sm:h-36"
            >
              <Image
                src={image.image_url}
                alt={property.title}
                fill
                unoptimized
                sizes="(min-width: 640px) 25vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm leading-7 text-muted whitespace-pre-line">
          {property.description}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoStat
          label="Alquiler mensual"
          value={
            property.total_monthly_rent !== null
              ? `${property.total_monthly_rent.toLocaleString("es-ES")} €`
              : "Sin definir"
          }
        />
        <InfoStat
          label="Fianza"
          value={
            property.deposit !== null
              ? `${property.deposit.toLocaleString("es-ES")} €`
              : "Sin definir"
          }
        />
        <InfoStat
          label="Habitaciones / Baños"
          value={`${property.bedrooms} / ${property.bathrooms}`}
        />
        <InfoStat
          label="Máximo de inquilinos"
          value={String(property.max_tenants)}
        />
      </div>

      {property.amenities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {property.amenities.map((amenity) => (
            <span
              key={amenity.id}
              className="rounded-full bg-surface-soft px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {amenity.label}
            </span>
          ))}
        </div>
      )}

      {actionError && (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {property.status === "DRAFT" && (
          <button
            type="button"
            disabled={actioning}
            onClick={() => run(() => markPropertyReady(property.id))}
            className="h-11 rounded-2xl bg-brand-dark px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            Marcar como preparado
          </button>
        )}

        {property.status === "READY" && (
          <button
            type="button"
            disabled={actioning}
            onClick={() => run(() => pauseProperty(property.id))}
            className="h-11 rounded-2xl border border-amber-200 bg-amber-50 px-5 text-sm font-bold text-amber-800 disabled:opacity-60"
          >
            Pausar
          </button>
        )}

        {property.status === "PAUSED" && (
          <button
            type="button"
            disabled={actioning}
            onClick={() => run(() => resumeProperty(property.id))}
            className="h-11 rounded-2xl bg-brand-dark px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            Volver a preparar
          </button>
        )}

        {(property.status === "READY" || property.status === "PAUSED") && (
          <button
            type="button"
            disabled={actioning}
            onClick={() => run(() => markPropertyRented(property.id))}
            className="h-11 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-bold text-blue-700 disabled:opacity-60"
          >
            Marcar como alquilado
          </button>
        )}

        {property.status !== "ARCHIVED" && (
          <button
            type="button"
            disabled={actioning}
            onClick={() =>
              run(() => archiveProperty(property.id)).then(() =>
                router.refresh()
              )
            }
            className="h-11 rounded-2xl border border-line bg-surface px-5 text-sm font-bold text-muted transition hover:bg-surface-soft disabled:opacity-60"
          >
            Archivar
          </button>
        )}
      </div>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}
