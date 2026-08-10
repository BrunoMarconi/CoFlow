"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  cancelCommunityInvitation,
  createCommunityInvitation,
  getCommunityInvitations,
} from "@/services/invitations";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { MOTION_DURATION, MOTION_SPRING } from "@/lib/motionTokens";
import type { CommunityInvitation } from "@/types/invitation";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
  CANCELLED: "Cancelada",
  EXPIRED: "Caducada",
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-mint-100 text-primary-dark",
  ACCEPTED: "bg-mint-100 text-primary-dark",
  DECLINED: "bg-surface-soft text-muted",
  CANCELLED: "bg-surface-soft text-muted",
  EXPIRED: "bg-amber-100 text-amber-700",
};

export default function CommunityInvitationsManager({
  communityId,
}: {
  communityId: number;
}) {
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    let active = true;

    getCommunityInvitations(communityId)
      .then((data) => {
        if (active) setInvitations(data);
      })
      .catch(() => {
        if (active) setLoadError("No pudimos cargar las invitaciones.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [communityId]);

  async function handleCreate() {
    if (creating) return;

    setCreating(true);
    setCreateError("");

    try {
      const invitation = await createCommunityInvitation(communityId);
      setInvitations((current) => [invitation, ...current]);
      setJustCreated(true);
      window.setTimeout(() => setJustCreated(false), 2000);
    } catch (error) {
      setCreateError(
        getCommunityErrorMessage(
          error,
          "No pudimos generar la invitación. Inténtalo de nuevo."
        )
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(invitation: CommunityInvitation) {
    const url = `${window.location.origin}/invitaciones/${invitation.token}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invitation.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Si el portapapeles no está disponible, no bloqueamos la UI.
    }
  }

  async function handleCancel(invitation: CommunityInvitation) {
    if (cancellingId) return;

    setCancellingId(invitation.id);

    try {
      const updated = await cancelCommunityInvitation(
        communityId,
        invitation.id
      );

      setInvitations((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch {
      // El estado se recupera al recargar; evitamos bloquear la lista.
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="p-3 sm:p-4">
      <p className="text-sm leading-6 text-muted">
        Invita aquí a las personas que ya viven contigo. Estas
        invitaciones no ocupan plazas abiertas.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: MOTION_DURATION.fast }}
          className="flex h-11 w-full items-center justify-center rounded-14 bg-brand px-5 text-sm font-bold text-white transition-colors duration-200 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {creating ? "Generando..." : "Generar nueva invitación"}
        </motion.button>

        <AnimatePresence>
          {justCreated && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={MOTION_SPRING.snappy}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1.5 text-xs font-bold text-primary-dark"
            >
              <CheckIcon />
              Invitación generada
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {createError && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          {createError}
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {loading ? (
          <p className="text-center text-sm text-muted">Cargando...</p>
        ) : loadError ? (
          <p className="text-center text-sm font-semibold text-red-600">
            {loadError}
          </p>
        ) : invitations.length === 0 ? (
          <p className="rounded-18 border border-dashed border-line bg-surface-soft p-5 text-center text-sm text-muted">
            Todavía no has generado ninguna invitación.
          </p>
        ) : (
          invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="rounded-14 border border-line bg-surface-soft p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    STATUS_CLASSES[invitation.status] ??
                    "bg-surface-soft text-muted"
                  }`}
                >
                  {STATUS_LABELS[invitation.status] ?? invitation.status}
                </span>

                <span className="text-xs text-muted">
                  Caduca {formatDate(invitation.expires_at)}
                </span>
              </div>

              {invitation.status === "PENDING" && (
                <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                  <motion.button
                    type="button"
                    onClick={() => handleCopy(invitation)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: MOTION_DURATION.fast }}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-14 border border-line bg-surface text-sm font-bold text-foreground transition-colors duration-200 hover:bg-surface-soft"
                  >
                    {copiedId === invitation.id
                      ? "Enlace copiado"
                      : "Copiar enlace"}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleCancel(invitation)}
                    disabled={cancellingId === invitation.id}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: MOTION_DURATION.fast }}
                    className="flex h-10 flex-1 items-center justify-center rounded-14 border border-red-200 bg-surface text-sm font-bold text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancellingId === invitation.id
                      ? "Cancelando..."
                      : "Cancelar"}
                  </motion.button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
