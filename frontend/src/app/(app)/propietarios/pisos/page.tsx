"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PropertyCard from "@/components/propietario/PropertyCard";
import {
  archiveProperty,
  getMyProperties,
  markPropertyReady,
  markPropertyRented,
  pauseProperty,
  resumeProperty,
} from "@/services/properties";
import type { PropertySummary } from "@/types/property";

export default function MisPisosPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();

  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadProperties() {
    setLoading(true);
    setError("");

    return getMyProperties()
      .then((data) => setProperties(data))
      .catch(() =>
        setError("No pudimos cargar tus pisos. Inténtalo de nuevo.")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!ownerProfile) return;

    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerProfile]);

  async function withRefresh(action: () => Promise<unknown>) {
    await action();
    await loadProperties();
  }

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
          Necesitas un perfil de propietario
        </h1>

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
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Mis pisos
        </h1>

        <Link
          href="/propietarios/pisos/nuevo"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          Añadir piso
        </Link>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : properties.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
            <p className="text-base font-semibold text-foreground">
              Todavía no has registrado ningún piso.
            </p>
            <Link
              href="/propietarios/pisos/nuevo"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-brand px-5 text-sm font-bold text-white"
            >
              Registrar mi primer piso
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onMarkReady={(id) => withRefresh(() => markPropertyReady(id))}
                onPause={(id) => withRefresh(() => pauseProperty(id))}
                onResume={(id) => withRefresh(() => resumeProperty(id))}
                onMarkRented={(id) =>
                  withRefresh(() => markPropertyRented(id))
                }
                onArchive={(id) => withRefresh(() => archiveProperty(id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
