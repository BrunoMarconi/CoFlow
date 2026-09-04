"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PropertyPublishFlow from "@/components/propietario/PropertyPublishFlow";
import { getMyProperty } from "@/services/properties";
import type { Property } from "@/types/property";

export default function NuevoPisoPage() {
  const { ownerProfile, ownerProfileLoading } = useAuth();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const [draftRequest, setDraftRequest] = useState<{
    id: string;
    property: Property | null;
    error: boolean;
  } | null>(null);

  const draftLoading = Boolean(draftId) && draftRequest?.id !== draftId;
  const draftError = draftRequest?.id === draftId && draftRequest.error;
  const draft = draftRequest?.id === draftId ? draftRequest.property : null;

  useEffect(() => {
    if (!draftId) return;

    let active = true;
    getMyProperty(Number(draftId))
      .then((property) => {
        if (active) setDraftRequest({ id: draftId, property, error: false });
      })
      .catch(() => {
        if (active) setDraftRequest({ id: draftId, property: null, error: true });
      });

    return () => {
      active = false;
    };
  }, [draftId]);

  if (ownerProfileLoading || draftLoading) {
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

  if (draftId && draftError) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-surface p-10 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          No hemos encontrado ese borrador
        </h1>

        <p className="mt-3 text-base leading-7 text-muted">
          Puede que ya lo hayas publicado, o que ya no exista.
        </p>

        <Link
          href="/propietarios/pisos"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          Volver a mis pisos
        </Link>
      </div>
    );
  }

  return <PropertyPublishFlow resumeProperty={draft ?? undefined} />;
}
