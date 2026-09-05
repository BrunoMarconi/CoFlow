"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
import PropertyEditPanel from "@/components/propietario/PropertyEditPanel";
import { getMyProperty } from "@/services/properties";
import type { Property } from "@/types/property";

export default function EditarPisoPage() {
  const params = useParams<{ id: string }>();
  const propertyId = Number(params.id);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { let active = true; getMyProperty(propertyId).then((data) => { if (active) setProperty(data); }).catch(() => { if (active) setNotFound(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [propertyId]);
  if (loading) return <PageSkeleton variant="profile" />;
  if (notFound || !property) return <ErrorState title="No hemos encontrado esta vivienda" description="Puede que ya no esté disponible o que haya un problema de conexión." action={<Link href="/propietarios/pisos" className="inline-flex min-h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Volver a mis viviendas</Link>} />;
  if (["ARCHIVED", "RENTED"].includes(property.status)) return <ErrorState title="Esta vivienda no se puede editar" description={property.status === "RENTED" ? "Está marcada como alquilada y se conserva como referencia." : "La vivienda está archivada y no tiene actividad."} action={<Link href={`/propietarios/pisos/${property.id}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Ver vivienda</Link>} />;
  return <PropertyEditPanel initialProperty={property} />;
}
