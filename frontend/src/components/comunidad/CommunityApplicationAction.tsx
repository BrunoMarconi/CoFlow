"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  cancelApplication,
  createCommunityApplication,
  getMyApplications,
} from "@/services/applications";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { CommunityApplication } from "@/types/application";
import type { Community } from "@/types/community";

const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;

export default function CommunityApplicationAction({
  community,
  actionLabel = "Enviar solicitud",
}: {
  community: Community;
  actionLabel?: string;
}) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] =
    useState<CommunityApplication | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    getMyApplications()
      .then((applications) => {
        if (!active) return;

        const existing = applications.find(
          (item) => item.community_id === community.id
        );

        setApplication(existing ?? null);
      })
      .catch(() => {
        // Si falla la comprobación, dejamos que la persona intente enviar.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [community.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const trimmed = message.trim();

    if (trimmed.length < MIN_MESSAGE_LENGTH) {
      setError(
        `Escribe al menos ${MIN_MESSAGE_LENGTH} caracteres para presentarte.`
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await createCommunityApplication(community.id, {
        message: trimmed,
      });

      setApplication(created);
      setShowForm(false);
      setMessage("");
    } catch (submitError) {
      setError(
        getCommunityErrorMessage(
          submitError,
          "No pudimos enviar tu solicitud. Inténtalo de nuevo."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!application || cancelling) return;

    setCancelling(true);

    try {
      const updated = await cancelApplication(application.id);
      setApplication(updated);
    } catch {
      // Si falla la cancelación, el estado se puede reintentar.
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="flex h-14 items-center justify-center gap-2 rounded-18 bg-surface-soft px-5 text-sm font-bold text-muted"
      >
        Comprobando...
      </button>
    );
  }

  if (application?.status === "PENDING") {
    return (
      <div className="sm:col-span-2">
        <div className="flex h-14 items-center justify-between gap-3 rounded-18 border border-primary/30 bg-mint-50 px-5">
          <span className="text-sm font-bold text-primary-dark">
            Tu solicitud está pendiente de revisión.
          </span>

          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="shrink-0 text-xs font-bold text-red-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? "Cancelando..." : "Cancelar solicitud"}
          </button>
        </div>
      </div>
    );
  }

  const previousOutcome =
    application?.status === "REJECTED"
      ? "Tu solicitud anterior fue rechazada."
      : application?.status === "CANCELLED"
        ? "Has cancelado tu solicitud anterior."
        : null;

  if (showForm) {
    return (
      <div className="sm:col-span-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-18 border border-border bg-surface p-5"
        >
          <p className="text-sm font-bold text-brand-dark">
            Cuéntale a la comunidad quién eres
          </p>

          <p className="mt-1 text-xs leading-5 text-muted">
            Esta solicitud es para ocupar una plaza abierta. El
            administrador revisará tu perfil y tu mensaje antes de decidir.
          </p>

          {(community.monthly_rent !== null ||
            user?.rental_budget !== undefined) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {community.monthly_rent !== null && (
                <div className="rounded-14 bg-surface-muted px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                    Aportación mensual esperada
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-brand-dark">
                    {community.monthly_rent.toLocaleString("es-ES")} €/mes
                  </p>
                </div>
              )}

              {user?.rental_budget !== null &&
                user?.rental_budget !== undefined && (
                  <div className="rounded-14 bg-surface-muted px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Tu presupuesto
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-brand-dark">
                      Hasta {user.rental_budget.toLocaleString("es-ES")} €/mes
                    </p>
                  </div>
                )}
            </div>
          )}

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escribe una breve presentación: quién eres, tu situación actual y por qué te gustaría unirte..."
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            disabled={submitting}
            className="mt-3 w-full resize-none rounded-18 border border-border bg-surface-muted px-4 py-3 text-sm leading-6 text-brand-dark outline-none transition focus:border-primary disabled:opacity-60"
          />

          <p className="mt-1 text-right text-xs text-muted">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </p>

          {error && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-14 bg-primary text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Enviando..." : "Enviar solicitud"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-brand-dark transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={previousOutcome ? "sm:col-span-2" : undefined}>
      {previousOutcome && (
        <p className="mb-2 text-xs font-semibold text-muted">
          {previousOutcome}
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-18 bg-primary px-5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover"
      >
        <SendIcon />
        {actionLabel}
      </button>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
