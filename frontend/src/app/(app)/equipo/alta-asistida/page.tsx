"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AssistedListingWizard from "@/components/equipo/AssistedListingWizard";
import ErrorState from "@/components/ui/ErrorState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { EDITABLE_STATUSES } from "@/lib/teamListing";
import { getPropertyAmenities } from "@/services/properties";
import { getTeamOwner, getTeamProperty } from "@/services/team";

export default function AssistedListingPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="community" />}>
      <AssistedListingLoader />
    </Suspense>
  );
}

function toId(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/* ?vivienda=ID edita un borrador existente; ?cliente=ID empieza una
 * vivienda nueva ya asignada a ese cliente (p. ej. "Añadir otra"). */
function AssistedListingLoader() {
  const searchParams = useSearchParams();
  const propertyId = toId(searchParams.get("vivienda"));
  const ownerId = propertyId === null ? toId(searchParams.get("cliente")) : null;

  const amenities = useQuery({
    queryKey: ["property-amenities"],
    queryFn: getPropertyAmenities,
    staleTime: 5 * 60_000,
  });
  const property = useQuery({
    queryKey: ["team-property", propertyId],
    queryFn: () => getTeamProperty(propertyId as number),
    enabled: propertyId !== null,
  });
  const owner = useQuery({
    queryKey: ["team-owner", ownerId],
    queryFn: () => getTeamOwner(ownerId as number),
    enabled: ownerId !== null,
  });

  // El formulario toma los datos una sola vez al montarse: se espera a
  // la respuesta fresca para no editar sobre una copia en caché antigua.
  if (
    amenities.isPending ||
    (propertyId !== null && !property.isFetchedAfterMount) ||
    (ownerId !== null && !owner.isFetchedAfterMount)
  ) {
    return <PageSkeleton variant="community" />;
  }

  if (propertyId !== null && !property.data) {
    return (
      <ErrorState
        title="No hemos encontrado esta vivienda"
        description="Puede que se haya eliminado o que haya un problema de conexión."
        onRetry={() => void property.refetch()}
        action={<Link href="/equipo/viviendas" className="inline-flex h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Ver todas las viviendas</Link>}
      />
    );
  }

  if (property.data && !EDITABLE_STATUSES.includes(property.data.status)) {
    return (
      <ErrorState
        title="Esta vivienda ya no se puede editar"
        description="Las viviendas alquiladas o archivadas se conservan tal como quedaron."
        action={<Link href={`/equipo/viviendas/${property.data.id}`} className="inline-flex h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Ver ficha</Link>}
      />
    );
  }

  return (
    <AssistedListingWizard
      key={searchParams.toString()}
      amenities={amenities.data ?? []}
      initialProperty={property.data ?? null}
      initialOwner={owner.data ?? null}
    />
  );
}
