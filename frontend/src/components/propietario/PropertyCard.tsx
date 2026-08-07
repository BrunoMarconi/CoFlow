"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import PropertyStatusBadge from "./PropertyStatusBadge";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { PropertySummary } from "@/types/property";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Piso",
  HOUSE: "Casa",
  STUDIO: "Estudio",
  SHARED_APARTMENT: "Piso preparado para compartir",
  OTHER: "Otro",
};

export default function PropertyCard({
  property,
  onMarkReady,
  onPause,
  onResume,
  onMarkRented,
  onArchive,
}: {
  property: PropertySummary;
  onMarkReady: (id: number) => Promise<void>;
  onPause: (id: number) => Promise<void>;
  onResume: (id: number) => Promise<void>;
  onMarkRented: (id: number) => Promise<void>;
  onArchive: (id: number) => Promise<void>;
}) {
  const [actioning, setActioning] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [actionError, setActionError] = useState("");
  const [imageError, setImageError] = useState(false);

  async function run(action: (id: number) => Promise<void>) {
    if (actioning) return;
    setActioning(true);
    setActionError("");

    try {
      await action(property.id);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "El piso todavía no puede marcarse como preparado. Edítalo para completar los datos que falten."
        )
      );
    } finally {
      setActioning(false);
      setConfirmingArchive(false);
    }
  }

  const location = property.neighborhood
    ? `${property.neighborhood}, ${property.city}`
    : property.city;

  const updatedLabel = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(property.updated_at));

  return (
    <article className="flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-surface shadow-sm">
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-surface-soft">
        {property.cover_image_url && !imageError ? (
          <Image
            src={property.cover_image_url}
            alt={property.title}
            onError={() => setImageError(true)}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted">
            Sin fotografías
          </div>
        )}

        <div className="absolute left-3 top-3">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">
          {PROPERTY_TYPE_LABELS[property.property_type] ?? "Piso"}
        </p>

        <h3 className="mt-1 truncate text-lg font-bold text-foreground">
          {property.title}
        </h3>

        <p className="mt-1 text-sm text-muted">{location}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-foreground">
          {property.total_monthly_rent !== null && (
            <span>
              {property.total_monthly_rent.toLocaleString("es-ES")} €/mes
            </span>
          )}
          <span className="text-muted">
            {property.bedrooms}{" "}
            {property.bedrooms === 1 ? "habitación" : "habitaciones"}
          </span>
          <span className="text-muted">
            Máx. {property.max_tenants}{" "}
            {property.max_tenants === 1 ? "inquilino" : "inquilinos"}
          </span>
        </div>

        <p className="mt-2 text-xs text-muted">
          Actualizado el {updatedLabel}
        </p>

        {actionError && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            {actionError}
          </p>
        )}

        <div className="mt-auto pt-4">
          {confirmingArchive ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-700">
                ¿Archivar este piso? Dejará de aparecer en el listado
                principal.
              </p>

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => run(onArchive)}
                  className="h-9 flex-1 rounded-lg bg-red-600 text-xs font-bold text-white disabled:opacity-60"
                >
                  Archivar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingArchive(false)}
                  className="h-9 flex-1 rounded-lg border border-line bg-surface text-xs font-bold text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/propietarios/pisos/${property.id}`}
                className="flex min-h-10 items-center justify-center rounded-xl border border-line bg-surface px-3 py-2 text-center text-xs font-bold leading-tight text-foreground transition hover:bg-surface-soft"
              >
                Ver
              </Link>

              {property.status === "DRAFT" && (
                <Link
                  href={`/propietarios/pisos/${property.id}/editar`}
                  className="flex min-h-10 items-center justify-center rounded-xl bg-brand px-3 py-2 text-center text-xs font-bold leading-tight text-white transition hover:bg-brand-dark"
                >
                  Continuar editando
                </Link>
              )}

              {(property.status === "READY" ||
                property.status === "PAUSED") && (
                <Link
                  href={`/propietarios/pisos/${property.id}/editar`}
                  className="flex min-h-10 items-center justify-center rounded-xl border border-line bg-surface px-3 py-2 text-center text-xs font-bold leading-tight text-foreground transition hover:bg-surface-soft"
                >
                  Editar
                </Link>
              )}

              {property.status === "DRAFT" && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => run(onMarkReady)}
                  className="col-span-2 flex min-h-10 items-center justify-center rounded-xl bg-brand-dark px-3 py-2 text-center text-xs font-bold leading-tight text-white disabled:opacity-60"
                >
                  Marcar como preparado
                </button>
              )}

              {property.status === "READY" && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => run(onPause)}
                  className="flex min-h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-bold leading-tight text-amber-800 disabled:opacity-60"
                >
                  Pausar
                </button>
              )}

              {property.status === "PAUSED" && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => run(onResume)}
                  className="flex min-h-10 items-center justify-center rounded-xl bg-brand-dark px-3 py-2 text-center text-xs font-bold leading-tight text-white disabled:opacity-60"
                >
                  Volver a preparar
                </button>
              )}

              {(property.status === "READY" ||
                property.status === "PAUSED") && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => run(onMarkRented)}
                  className="flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-bold leading-tight text-blue-700 disabled:opacity-60"
                >
                  Marcar como alquilado
                </button>
              )}

              {property.status !== "ARCHIVED" && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={() => setConfirmingArchive(true)}
                  className="col-span-2 flex min-h-10 items-center justify-center rounded-xl border border-line bg-surface px-3 py-2 text-center text-xs font-bold leading-tight text-muted transition hover:bg-surface-soft disabled:opacity-60"
                >
                  Archivar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
