"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { getBlockedUsers, unblockUser } from "@/services/users";
import type { BlockedUser } from "@/types/userSafety";

const QUERY_KEY = ["blocked-users"];

export default function BlockedUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actioningId, setActioningId] = useState<string | null>(null);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getBlockedUsers,
  });

  async function unblock(user: BlockedUser) {
    if (actioningId) return;
    setActioningId(user.id);
    try {
      await unblockUser(user.id);
      queryClient.setQueryData<BlockedUser[]>(QUERY_KEY, (current = []) =>
        current.filter((item) => item.id !== user.id)
      );
      toast.success(`${user.first_name} ya no está bloqueado.`);
    } catch {
      toast.error("No hemos podido desbloquear a esta persona.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <header className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-surface-soft">
          <ArrowLeftIcon />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Personas bloqueadas</h1>
          <p className="mt-1 text-sm text-secondary">Puedes desbloquearlas cuando quieras.</p>
        </div>
      </header>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center"><Spinner /></div>
        ) : isError ? (
          <p role="alert" className="rounded-18 border border-red-100 bg-red-50 p-5 text-center text-sm font-semibold text-red-700">No hemos podido cargar esta lista.</p>
        ) : data.length === 0 ? (
          <EmptyState title="No has bloqueado a nadie" description="Las personas que bloquees aparecerán aquí para que puedas gestionar la lista." />
        ) : (
          <div className="overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
            {data.map((user) => (
              <BlockedUserRow key={user.id} user={user} actioning={actioningId === user.id} onUnblock={() => unblock(user)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockedUserRow({ user, actioning, onUnblock }: { user: BlockedUser; actioning: boolean; onUnblock: () => void }) {
  const [imageError, setImageError] = useState(false);
  const initials = [user.first_name, user.last_name].filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
      {user.avatar_url && !imageError ? (
        <Image src={user.avatar_url} alt="" width={48} height={48} unoptimized onError={() => setImageError(true)} className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-sm font-bold text-white">{initials || "CF"}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-foreground">{`${user.first_name} ${user.last_name}`.trim()}</p>
        <p className="mt-0.5 text-xs text-secondary">No puede encontrarte ni escribirte</p>
      </div>
      <button type="button" onClick={onUnblock} disabled={actioning} className="flex h-10 shrink-0 items-center justify-center rounded-full border border-foreground px-4 text-xs font-bold text-foreground transition hover:bg-black hover:text-white disabled:opacity-50">
        {actioning ? "..." : "Desbloquear"}
      </button>
    </div>
  );
}

function ArrowLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>;
}
