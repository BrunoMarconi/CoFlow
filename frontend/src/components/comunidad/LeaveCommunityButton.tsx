"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { leaveCommunity } from "@/services/communities";
import { getCommunityErrorMessage } from "@/lib/communityErrors";

export default function LeaveCommunityButton({
  communityId,
}: {
  communityId: number;
}) {
  const router = useRouter();
  const { refreshCommunity } = useAuth();

  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");

  async function handleLeave() {
    if (leaving) return;

    setLeaving(true);
    setError("");

    try {
      await leaveCommunity(communityId);
      await refreshCommunity();

      router.push("/comunidades?left=1");
    } catch (leaveError) {
      setError(
        getCommunityErrorMessage(
          leaveError,
          "No pudimos completar la salida de la comunidad. Inténtalo de nuevo."
        )
      );
      setLeaving(false);
    }
  }

  if (!confirming) {
    return (
      <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
        <p className="text-sm font-bold text-foreground">
          ¿Ya no quieres seguir en esta comunidad?
        </p>

        <p className="mt-1.5 text-xs leading-5 text-muted">
          Puedes abandonarla en cualquier momento. Seguirás conservando tu
          cuenta y tu perfil en CoFlow.
        </p>

        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 h-10 rounded-xl border border-red-200 bg-surface px-4 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50"
        >
          Abandonar comunidad
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
      <h3 className="font-bold text-red-800">
        ¿Quieres abandonar esta comunidad?
      </h3>

      <p className="mt-2 text-sm leading-6 text-red-700">
        Dejarás de aparecer como miembro y perderás el acceso al chat y al
        espacio privado de la comunidad. Esta acción no elimina tu cuenta.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          disabled={leaving}
          className="h-12 rounded-xl border border-red-200 bg-white px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleLeave}
          disabled={leaving}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {leaving ? "Abandonando..." : "Sí, abandonar comunidad"}
        </button>
      </div>
    </div>
  );
}
