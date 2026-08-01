"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCommunity } from "@/services/communities";
import type { Community } from "@/types/community";

export default function CommunityOwnerActions({
  community,
}: {
  community: Community;
}) {
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleting) return;

    setDeleting(true);
    setError("");

    try {
      await deleteCommunity(community.id);

      router.push("/comunidades");
      router.refresh();
    } catch {
      setError(
        "No se pudo eliminar la comunidad. Inténtalo de nuevo."
      );
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/60 p-3.5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <TrashIcon />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-700">
              Eliminar comunidad
            </p>

            <p className="mt-0.5 text-xs leading-5 text-red-600/90">
              Se cerrará la comunidad y los miembros perderán acceso al
              chat y al espacio privado.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-bold text-red-600 transition hover:bg-red-100"
        >
          <TrashIcon className="h-4 w-4" />
          Eliminar comunidad
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
      <h3 className="text-sm font-bold text-red-800">
        ¿Eliminar esta comunidad?
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-red-700">
        La comunidad dejará de aparecer públicamente y los miembros
        perderán acceso al chat y al espacio privado. Después podrás
        crear otra comunidad con tu cuenta.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
        >
          {deleting ? (
            <>
              <LoadingIcon />
              Eliminando...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4" />
              Sí, eliminar
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          disabled={deleting}
          className="flex h-11 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TrashIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6 18 21H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
