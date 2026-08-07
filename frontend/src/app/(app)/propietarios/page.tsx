"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PropertySummaryStats from "@/components/propietario/PropertySummaryStats";
import OwnerTrustSummary from "@/components/propietario/OwnerTrustSummary";
import { getMyProperties } from "@/services/properties";
import type { PropertySummary } from "@/types/property";

export default function PropietariosResumenPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();

  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerProfile) return;

    let active = true;

    getMyProperties()
      .then((data) => {
        if (active) setProperties(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ownerProfile]);

  if (ownerProfileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!ownerProfile) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Todavía no tienes perfil de propietario
        </h1>

        <p className="mt-3 text-base leading-7 text-muted">
          Crea tu perfil para empezar a registrar tus viviendas.
        </p>

        <Link
          href="/propietarios/perfil"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          Crear perfil de propietario
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Hola, {ownerProfile.display_name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Este es el resumen de tus pisos en CoFlow.
          </p>
        </div>

        <Link
          href="/propietarios/pisos/nuevo"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          Registrar un piso
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <PropertySummaryStats properties={properties} />
        )}
      </div>

      <div className="mt-6">
        <OwnerTrustSummary ownerProfile={ownerProfile} />
      </div>
    </div>
  );
}
