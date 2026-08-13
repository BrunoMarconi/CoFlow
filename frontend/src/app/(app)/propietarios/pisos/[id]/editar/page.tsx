"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
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
  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>;
  if (notFound || !property) return <div className="rounded-[1.5rem] border border-[#dddddd] bg-white p-10 text-center"><h1 className="text-2xl font-semibold">No hemos encontrado este piso</h1><Link href="/propietarios/pisos" className="mt-6 inline-flex h-12 items-center rounded-full bg-black px-6 font-semibold text-white">Volver a mis pisos</Link></div>;
  if (["ARCHIVED", "RENTED"].includes(property.status)) return <div className="rounded-[1.5rem] border border-[#dddddd] bg-white p-10 text-center"><h1 className="text-2xl font-semibold">Este piso no se puede editar</h1><Link href={`/propietarios/pisos/${property.id}`} className="mt-6 inline-flex h-12 items-center rounded-full bg-black px-6 font-semibold text-white">Ver piso</Link></div>;
  return <PropertyEditPanel initialProperty={property} />;
}
