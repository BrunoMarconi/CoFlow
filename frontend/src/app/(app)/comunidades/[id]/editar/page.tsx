"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";

import CommunityForm from "@/components/comunidad/CommunityForm";
import Spinner from "@/components/ui/Spinner";

import {
  getCommunity,
  updateCommunity,
} from "@/services/communities";

import { getCommunityErrorMessage } from "@/lib/communityErrors";

import type { Community } from "@/types/community";
import type { CommunityFormValues } from "@/components/comunidad/CommunityForm";

export default function EditarComunidadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [community, setCommunity] =
    useState<Community | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [forbidden, setForbidden] =
    useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;

    getCommunity(params.id)
      .then((data) => {
        if (!active) return;

        if (data.owner_id !== user.id) {
          setForbidden(true);
          return;
        }

        setCommunity(data);
      })
      .catch(() => {
        if (active) {
          setError(
            "No hemos podido cargar esta comunidad."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [params.id, user, authLoading]);

  async function handleUpdate(
    values: CommunityFormValues
  ) {
    if (!community || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const updatedCommunity =
        await updateCommunity(
          community.id,
          values
        );

      router.push(
        `/comunidades/${updatedCommunity.id}`
      );
    } catch (updateError) {
      setError(
        getCommunityErrorMessage(
          updateError,
          "No pudimos guardar los cambios. Inténtalo de nuevo."
        )
      );

      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
          Acceso denegado
        </p>

        <h1 className="mt-3 text-3xl font-bold text-brand-dark">
          No puedes editar esta comunidad
        </h1>

        <p className="mt-4 text-muted">
          Solo el administrador que creó la comunidad
          puede modificarla.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(`/comunidades/${params.id}`)
          }
          className="mt-7 rounded-18 bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          Volver a la comunidad
        </button>
      </div>
    );
  }

  if (!community || !community.preferences) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-brand-dark">
          No podemos editar esta comunidad
        </h1>

        <p className="mt-3 text-muted">
          La comunidad no existe o todavía no tiene sus
          preferencias configuradas.
        </p>

        {error && (
          <p className="mt-4 text-sm font-semibold text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            router.push("/comunidades")
          }
          className="mt-7 rounded-18 bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          Volver a comunidades
        </button>
      </div>
    );
  }

  const initialValues: CommunityFormValues = {
    name: community.name,
    description: community.description,
    city: community.city,
    province: community.province,
    neighborhood: community.neighborhood,
    max_members: community.max_members,
    join_type: community.join_type,
    open_spots: community.open_spots,
    urgency: community.urgency,
    profile_type: community.profile_type,
    profile_description: community.profile_description,
    monthly_rent: community.monthly_rent,
    deposit: community.deposit,
    move_in_date: community.move_in_date,
    room_description: community.room_description,
    preferences: {
      cleanliness:
        community.preferences.cleanliness,
      atmosphere:
        community.preferences.atmosphere,
      visits: community.preferences.visits,
      sleepovers:
        community.preferences.sleepovers,
      smoking: community.preferences.smoking,
      pets: community.preferences.pets,
      rules: community.preferences.rules,
      lifestyle:
        community.preferences.lifestyle,
    },
  };

  return (
    <CommunityForm
      mode="edit"
      initialValues={initialValues}
      submitting={submitting}
      serverError={error}
      onSubmit={handleUpdate}
      onCancel={() =>
        router.push(
          `/comunidades/${community.id}`
        )
      }
    />
  );
}