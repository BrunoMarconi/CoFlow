"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown, MoreHorizontal, ShieldCheck, UserMinus } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { removeCommunityMember, transferCommunityOwnership } from "@/services/communities";
import type { CommunityMember } from "@/types/community";

export default function CommunityMembersList({
  communityId,
  members,
  currentUserId,
  isOwner,
  onUpdated,
}: {
  communityId: number;
  members: CommunityMember[];
  currentUserId: string;
  isOwner: boolean;
  onUpdated: () => Promise<unknown> | void;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function remove(member: CommunityMember) {
    if (busyId || !window.confirm(`¿Quitar a ${member.user.first_name} de la comunidad?`)) return;
    setBusyId(member.id);
    setError("");
    try {
      await removeCommunityMember(communityId, member.user_id);
      await onUpdated();
    } catch (caught) {
      setError(getCommunityErrorMessage(caught, "No hemos podido quitar a esta persona."));
    } finally {
      setBusyId(null);
      setOpenId(null);
    }
  }

  async function transfer(member: CommunityMember) {
    if (busyId || !window.confirm(`¿Transferir la administración a ${member.user.first_name}? Tú pasarás a ser miembro.`)) return;
    setBusyId(member.id);
    setError("");
    try {
      await transferCommunityOwnership(communityId, member.user_id);
      await onUpdated();
    } catch (caught) {
      setError(getCommunityErrorMessage(caught, "No hemos podido transferir la administración."));
    } finally {
      setBusyId(null);
      setOpenId(null);
    }
  }

  return (
    <div>
      <div className="divide-y divide-border overflow-visible rounded-18 border border-border bg-surface shadow-soft">
        {members.map((member) => {
          const name = `${member.user.first_name} ${member.user.last_name}`.trim();
          const canManage = isOwner && member.user_id !== currentUserId && member.role !== "OWNER";
          return (
            <div key={member.id} className="relative flex min-h-20 items-center gap-3 px-4 py-3 transition hover:bg-surface-soft">
              <Link href={`/personas/${member.user_id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <UserAvatar firstName={member.user.first_name} lastName={member.user.last_name} userId={member.user.id} imageUrl={member.user.avatar_url} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{name}{member.user_id === currentUserId ? " (tú)" : ""}</span>
                    {member.user.is_email_verified ? <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" aria-label="Perfil verificado" /> : null}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-secondary">
                    {member.role === "OWNER" ? <><Crown className="h-3.5 w-3.5 text-primary" /> Administrador</> : `Miembro desde ${formatJoinedDate(member.joined_at)}`}
                  </span>
                </span>
                {!canManage ? <ChevronRight className="h-5 w-5 shrink-0 text-muted" /> : null}
              </Link>

              {canManage ? (
                <button type="button" onClick={() => setOpenId((value) => value === member.id ? null : member.id)} aria-label={`Gestionar a ${name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-secondary transition hover:border-primary/30 hover:bg-surface-soft hover:text-foreground">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              ) : null}

              {openId === member.id ? (
                <div className="absolute right-4 top-16 z-20 w-64 overflow-hidden rounded-18 border border-border bg-surface p-2 shadow-[0_12px_36px_rgba(0,0,0,0.14)]">
                  <button type="button" onClick={() => transfer(member)} disabled={busyId !== null} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-foreground hover:bg-surface-soft disabled:opacity-50"><Crown className="h-4 w-4 text-primary" /> Transferir administración</button>
                  <button type="button" onClick={() => remove(member)} disabled={busyId !== null} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"><UserMinus className="h-4 w-4" /> Quitar de la comunidad</button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {error ? <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function formatJoinedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "hace poco" : new Intl.DateTimeFormat("es-ES", { month: "short", year: "numeric" }).format(date);
}
