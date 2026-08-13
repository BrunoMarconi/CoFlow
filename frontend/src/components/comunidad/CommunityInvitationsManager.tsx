"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Search, Send, UserPlus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import {
  cancelCommunityInvitation,
  createCommunityInvitation,
  getCommunityInvitations,
} from "@/services/invitations";
import { getPublicUsers } from "@/services/users";
import type { CommunityInvitation } from "@/types/invitation";
import type { UserPublicProfile } from "@/types/userPublic";

const STATUS_LABELS: Record<CommunityInvitation["status"], string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
  CANCELLED: "Cancelada",
  EXPIRED: "Caducada",
};

export default function CommunityInvitationsManager({
  communityId,
}: {
  communityId: number;
}) {
  const { community, refreshCommunity } = useAuth();
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [people, setPeople] = useState<UserPublicProfile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const atCapacity = Boolean(
    community && community.member_count >= community.max_members
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      getCommunityInvitations(communityId),
      getPublicUsers({ limit: 50 }),
    ])
      .then(([invitationData, userData]) => {
        if (!active) return;
        setInvitations(invitationData);
        setPeople(
          userData.filter((person) => person.community === null)
        );
      })
      .catch(() => {
        if (active) setError("No hemos podido cargar las invitaciones.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [communityId]);

  const pendingByUser = useMemo(
    () =>
      new Set(
        invitations
          .filter((item) => item.status === "PENDING")
          .map((item) => item.invited_user_id)
          .filter((value): value is string => Boolean(value))
      ),
    [invitations]
  );

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    if (!normalized) return people.slice(0, 5);
    return people
      .filter((person) =>
        `${person.first_name} ${person.last_name} ${person.occupation ?? ""}`
          .toLocaleLowerCase("es")
          .includes(normalized)
      )
      .slice(0, 8);
  }, [people, query]);

  async function createInvitation(invitedUserId?: string) {
    if (busyKey || atCapacity) return;
    setBusyKey(invitedUserId ?? "link");
    setError("");
    try {
      const invitation = await createCommunityInvitation(
        communityId,
        invitedUserId
      );
      setInvitations((current) => [invitation, ...current]);
      if (!invitedUserId) await copyInvitation(invitation);
    } catch (caught) {
      setError(
        getCommunityErrorMessage(
          caught,
          "No hemos podido crear la invitación."
        )
      );
    } finally {
      setBusyKey(null);
      void refreshCommunity();
    }
  }

  async function copyInvitation(invitation: CommunityInvitation) {
    const url = `${window.location.origin}/invitaciones/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitation.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError("Copia el enlace desde la barra del navegador.");
    }
  }

  async function cancelInvitation(invitation: CommunityInvitation) {
    if (busyKey) return;
    setBusyKey(`cancel-${invitation.id}`);
    setError("");
    try {
      const updated = await cancelCommunityInvitation(
        communityId,
        invitation.id
      );
      setInvitations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch {
      setError("No hemos podido cancelar la invitación.");
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-[#717171]">Cargando invitaciones…</p>;
  }

  return (
    <div className="space-y-7 p-4 sm:p-6">
      <div>
        <h3 className="text-lg font-semibold text-[#191919]">Invitar personas</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-[#717171]">
          Invita directamente a alguien de CoFlow o comparte un enlace privado.
        </p>
      </div>

      {atCapacity ? (
        <p className="rounded-2xl border border-[#dddddd] p-4 text-sm font-medium text-[#191919]">
          La comunidad está completa. Aumenta su capacidad antes de invitar a otra persona.
        </p>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#717171]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre u ocupación"
              aria-label="Buscar una persona para invitar"
              className="h-13 w-full rounded-full border border-[#b0b0b0] bg-white pl-12 pr-4 text-base text-[#191919] outline-none transition focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="divide-y divide-[#ebebeb] rounded-2xl border border-[#dddddd] bg-white">
            {filteredPeople.length === 0 ? (
              <p className="p-5 text-sm text-[#717171]">No hay personas disponibles con esa búsqueda.</p>
            ) : (
              filteredPeople.map((person) => {
                const pending = pendingByUser.has(person.id);
                const name = `${person.first_name} ${person.last_name}`.trim();
                return (
                  <div key={person.id} className="flex min-h-18 items-center gap-3 px-4 py-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-sm font-semibold text-[#191919]">
                      {person.first_name.slice(0, 1)}{person.last_name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#191919]">{name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#717171]">{person.occupation || "Busca comunidad"}</span>
                    </span>
                    <button
                      type="button"
                      disabled={pending || busyKey !== null}
                      onClick={() => createInvitation(person.id)}
                      className="flex min-h-11 min-w-24 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-semibold text-white transition hover:bg-[#222222] disabled:bg-[#ebebeb] disabled:text-[#717171]"
                    >
                      {pending ? <><Check className="h-4 w-4" /> Enviada</> : busyKey === person.id ? "Enviando…" : <><Send className="h-4 w-4" /> Invitar</>}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => createInvitation()}
            disabled={busyKey !== null}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black bg-white px-5 text-sm font-semibold text-[#191919] transition hover:bg-[#f7f7f7] disabled:opacity-50"
          >
            <Link2 className="h-5 w-5" />
            {busyKey === "link" ? "Creando enlace…" : "Crear y copiar enlace privado"}
          </button>
        </>
      )}

      {error ? <p role="alert" className="text-sm font-medium text-red-600">{error}</p> : null}

      <section>
        <h3 className="text-base font-semibold text-[#191919]">Actividad reciente</h3>
        <div className="mt-3 divide-y divide-[#ebebeb] rounded-2xl border border-[#dddddd] bg-white">
          {invitations.length === 0 ? (
            <div className="flex items-center gap-3 p-5 text-sm text-[#717171]"><UserPlus className="h-5 w-5" /> Aún no has enviado invitaciones.</div>
          ) : (
            invitations.slice(0, 8).map((invitation) => (
              <div key={invitation.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#191919]">
                    {invitation.invited_user_id ? "Invitación directa" : "Enlace privado"}
                  </span>
                  <span className="mt-0.5 block text-xs text-[#717171]">
                    {STATUS_LABELS[invitation.status]} · {formatDate(invitation.expires_at)}
                  </span>
                </span>
                {invitation.status === "PENDING" ? (
                  <>
                    <button type="button" onClick={() => copyInvitation(invitation)} aria-label="Copiar enlace" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd] hover:bg-[#f7f7f7]">
                      {copiedId === invitation.id ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </button>
                    <button type="button" onClick={() => cancelInvitation(invitation)} aria-label="Cancelar invitación" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dddddd] text-[#717171] hover:bg-[#f7f7f7]">
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "sin fecha"
    : new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}
