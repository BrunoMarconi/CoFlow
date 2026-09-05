"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PageSkeleton from "@/components/ui/PageSkeleton";
import ErrorState from "@/components/ui/ErrorState";
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
    return <PageSkeleton variant="profile" />;
  }

  if (!ownerProfile) {
    return (
      <ErrorState title="Necesitas un perfil de propietario" description="Completa tus datos profesionales antes de registrar una vivienda." action={<Link href="/propietarios/perfil" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Crear perfil</Link>} />
    );
  }

  if (draftId && draftError) {
    return (
      <ErrorState title="No hemos encontrado ese borrador" description="Puede que ya esté preparado o que haya sido archivado." action={<Link href="/propietarios/pisos" className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white">Volver a mis viviendas</Link>} />
    );
  }

  return <PropertyPublishFlow resumeProperty={draft ?? undefined} />;
}
