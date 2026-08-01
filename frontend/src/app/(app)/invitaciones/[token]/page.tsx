"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import {
  acceptInvitation,
  declineInvitation,
  getInvitationByToken,
} from "@/services/invitations";
import type { CommunityInvitationDetail } from "@/types/invitation";

function formatExpiry(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const STATUS_MESSAGES: Record<string, string> = {
  ACCEPTED: "Esta invitación ya fue aceptada.",
  DECLINED: "Esta invitación fue rechazada.",
  CANCELLED: "Esta invitación fue cancelada por el administrador.",
  EXPIRED: "Esta invitación ha caducado.",
};

export default function InvitacionPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { refreshCommunity } = useAuth();

  const [invitation, setInvitation] =
    useState<CommunityInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    let active = true;

    getInvitationByToken(params.token)
      .then((data) => {
        if (active) setInvitation(data);
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
  }, [params.token]);

  async function handleAccept() {
    if (submitting) return;

    setSubmitting(true);
    setActionError("");

    try {
      await acceptInvitation(params.token);
      await refreshCommunity();
      router.push("/mi-comunidad");
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "No pudimos procesar la invitación. Inténtalo de nuevo."
        )
      );
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (submitting) return;

    setSubmitting(true);
    setActionError("");

    try {
      await declineInvitation(params.token);
      setDeclined(true);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "No pudimos procesar la invitación. Inténtalo de nuevo."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !invitation) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-green-600">
          Invitación no encontrada
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#163B2E]">
          Este enlace ya no es válido
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-gray-500">
          Puede que el enlace esté mal copiado o que la invitación ya no
          exista.
        </p>

        <Link
          href="/comunidades"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-green-500 px-6 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition hover:-translate-y-0.5 hover:bg-green-600"
        >
          Explorar comunidades
        </Link>
      </div>
    );
  }

  const isPending = invitation.status === "PENDING" && !declined;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
          Invitación a una comunidad
        </p>

        <h1 className="mt-3 text-2xl font-bold text-[#163B2E] sm:text-3xl">
          {invitation.community.name}
        </h1>

        <p className="mt-2 text-sm font-semibold text-gray-500">
          {invitation.community.city} ·{" "}
          {invitation.community.member_count}{" "}
          {invitation.community.member_count === 1
            ? "miembro actual"
            : "miembros actuales"}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Administrada por {invitation.community.owner_first_name}{" "}
          {invitation.community.owner_last_name}
        </p>

        <p className="mt-5 rounded-2xl bg-[#F8FAFC] p-4 text-sm leading-6 text-gray-600">
          Esta invitación es para una persona que ya vive en la vivienda.
          Al aceptarla, aparecerá como miembro de la comunidad, pero no
          ocupará una plaza abierta. Tendrás acceso al chat grupal dentro
          de CoFlow.
        </p>

        {isPending && (
          <p className="mt-3 text-xs font-semibold text-gray-400">
            Caduca el {formatExpiry(invitation.expires_at)}
          </p>
        )}

        {declined ? (
          <p className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-600">
            Has rechazado esta invitación.
          </p>
        ) : !isPending ? (
          <p className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-700">
            {STATUS_MESSAGES[invitation.status] ??
              "Esta invitación ya no está disponible."}
          </p>
        ) : (
          <>
            {actionError && (
              <p
                role="alert"
                className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {actionError}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAccept}
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-green-500 text-sm font-bold text-white shadow-lg shadow-green-500/20 transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
              >
                {submitting ? "Procesando..." : "Aceptar invitación"}
              </button>

              <button
                type="button"
                onClick={handleDecline}
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center rounded-2xl border border-gray-200 bg-white text-sm font-bold text-[#163B2E] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
              >
                Rechazar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
