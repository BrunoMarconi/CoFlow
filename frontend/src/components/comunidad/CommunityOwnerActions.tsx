"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteCommunity } from "@/services/communities";
import type { Community } from "@/types/community";

export default function CommunityOwnerActions({ community }: { community: Community }) {
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
      router.replace("/comunidades");
      router.refresh();
    } catch {
      setError("No se pudo cerrar la comunidad. Inténtalo de nuevo.");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f7f7]"><Trash2 className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#222222]">Cerrar comunidad</p>
            <p className="mt-1 text-xs leading-5 text-[#717171]">Dejará de aparecer públicamente y sus miembros perderán acceso al espacio privado.</p>
          </div>
        </div>
        <button type="button" onClick={() => setConfirming(true)} className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl border border-red-500 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50">Continuar</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-5">
      <h3 className="text-base font-semibold text-[#222222]">¿Cerrar {community.name}?</h3>
      <p className="mt-2 text-sm leading-6 text-[#717171]">Esta acción no se puede deshacer. Después podrás crear otra comunidad con tu cuenta.</p>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <button type="button" onClick={handleDelete} disabled={deleting} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">{deleting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Cerrando…</> : "Sí, cerrar comunidad"}</button>
        <button type="button" onClick={() => { setConfirming(false); setError(""); }} disabled={deleting} className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#222222] bg-white px-5 text-sm font-semibold text-[#222222] hover:bg-[#f7f7f7] disabled:opacity-50">Cancelar</button>
      </div>
    </div>
  );
}
