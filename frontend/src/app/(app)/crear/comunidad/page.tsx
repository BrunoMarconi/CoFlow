"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import CommunityForm from "@/components/comunidad/CommunityForm";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

import { createCommunity } from "@/services/communities";

import { getCommunityErrorMessage } from "@/lib/communityErrors";

import type { CommunityFormValues } from "@/components/comunidad/CommunityForm";

export default function CrearComunidadPage() {
  const router = useRouter();
  const { community, communityLoading, refreshCommunity } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!communityLoading && community) {
      router.replace(`/comunidades/${community.id}`);
    }
  }, [communityLoading, community, router]);

  async function handleCreate(
    values: CommunityFormValues
  ) {
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const community = await createCommunity(values);

      await refreshCommunity();

      router.push(`/comunidades/${community.id}`);
    } catch (createError) {
      setError(
        getCommunityErrorMessage(
          createError,
          "No pudimos crear la comunidad. Revisa los datos e inténtalo de nuevo."
        )
      );

      setSubmitting(false);
    }
  }

  if (communityLoading || community) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <CommunityForm
      mode="create"
      submitting={submitting}
      serverError={error}
      onSubmit={handleCreate}
      onCancel={() => router.back()}
    />
  );
}