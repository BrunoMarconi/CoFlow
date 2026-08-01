"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import PropertyForm from "@/components/propietario/PropertyForm";
import { getMyProperty } from "@/services/properties";
import type { Property } from "@/types/property";

export default function EditarPisoPage() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    getMyProperty(propertyId)
      .then((data) => {
        if (active) setProperty(data);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [propertyId]);

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

  if (property.status === "ARCHIVED" || property.status === "RENTED") {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {property.status === "ARCHIVED"
            ? "Este piso está archivado"
            : "Este piso ya está alquilado"}
        </h1>

        <p className="mt-3 text-base leading-7 text-muted">
          {property.status === "ARCHIVED"
            ? "Los pisos archivados no se pueden editar."
            : "Los pisos marcados como alquilados no se pueden editar."}
        </p>

        <Link
          href={`/propietarios/pisos/${property.id}`}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white"
        >
          Ver piso
        </Link>
      </div>
    );
  }

  return <PropertyForm initialProperty={property} />;
}
