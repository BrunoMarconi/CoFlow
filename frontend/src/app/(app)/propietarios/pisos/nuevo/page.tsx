"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PropertyForm from "@/components/propietario/PropertyForm";

export default function NuevoPisoPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();

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

        <p className="mt-3 text-base leading-7 text-muted">
          Crea tu perfil antes de registrar un piso.
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

  return <PropertyForm />;
}
