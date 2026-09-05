"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  cancelApplication,
  createCommunityApplication,
  getMyApplications,
} from "@/services/applications";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { getPublicUserProfile } from "@/services/users";
import type { CommunityApplication } from "@/types/application";
import type { Community } from "@/types/community";
import type { PublicUserPreferences } from "@/types/userPublic";

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
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [userPreferences, setUserPreferences] = useState<PublicUserPreferences | null>(null);

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

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    getPublicUserProfile(user.id)
      .then((profile) => { if (active) setUserPreferences(profile.preferences); })
      .catch(() => { /* La solicitud sigue disponible sin comparación. */ });
    return () => { active = false; };
  }, [user?.id]);

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

    if (!reviewing) {
      setReviewing(true);
      setError("");
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
      setReviewing(false);
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
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-[18px] border border-primary/20 bg-[#eef5f1] px-4 py-3 sm:px-5">
          <span className="min-w-0"><span className="block text-sm font-bold text-primary-dark">Solicitud enviada</span><Link href="/invitaciones?tab=sent" className="mt-0.5 block text-xs text-secondary underline underline-offset-3">Consultar estado</Link></span>

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
    const budgetFits = community.monthly_rent !== null && user?.rental_budget != null
      ? user.rental_budget >= community.monthly_rent
      : null;
    const comparisons = getPreferenceComparisons(community, userPreferences);
    const matchingCount = comparisons.filter((item) => item.matches).length;

    return (
      <div className="sm:col-span-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] p-4 shadow-[0_12px_34px_rgba(20,42,32,.055)] sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{reviewing ? "Revisión final" : "Antes de solicitar"}</p><p className="mt-1 text-base font-bold text-brand-dark">{reviewing ? "Esto recibirá la comunidad" : `Tu encaje con ${community.name}`}</p></div>
            <span className="rounded-full bg-[#e9eeea] px-2.5 py-1 text-[10px] font-bold text-primary-dark">{reviewing ? "Paso 2 de 2" : "Paso 1 de 2"}</span>
          </div>

          {!reviewing ? <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryMetric label="Plazas" value={`${community.open_spots} ${community.open_spots === 1 ? "disponible" : "disponibles"}`} />
              <SummaryMetric label="Miembros" value={`${community.member_count} de ${community.max_members}`} />
              <SummaryMetric label="Aportación" value={community.monthly_rent !== null ? `${community.monthly_rent.toLocaleString("es-ES")} €/mes` : "Por acordar"} />
              <SummaryMetric label="Tu presupuesto" value={user?.rental_budget != null ? `${user.rental_budget.toLocaleString("es-ES")} €/mes` : "Sin indicar"} />
            </div>

            {budgetFits === false && <div className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 px-3.5 py-3"><p className="text-xs font-bold text-amber-900">La aportación supera tu presupuesto actual</p><p className="mt-0.5 text-xs leading-5 text-amber-800">Puedes continuar si tu presupuesto es flexible, pero conviene explicarlo en tu presentación.</p></div>}

            {comparisons.length > 0 && <div className="mt-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-brand-dark">Hábitos comparables</p><p className="text-[11px] text-secondary">{matchingCount} de {comparisons.length} coinciden</p></div><div className="mt-2 grid gap-2 sm:grid-cols-2">{comparisons.map((item) => <div key={item.label} className="flex items-center gap-2 rounded-[12px] bg-white px-3 py-2.5"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${item.matches ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{item.matches ? "✓" : "·"}</span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold text-brand-dark">{item.label}</span><span className="block truncate text-[10px] text-secondary">{item.matches ? item.communityValue : "Preferencias distintas · conviene hablarlo"}</span></span></div>)}</div><p className="mt-2 text-[10px] leading-4 text-muted">Las diferencias no significan incompatibilidad: son temas útiles para una primera conversación.</p></div>}

            <div className="mt-4 rounded-[14px] bg-[#eef3ef] px-3.5 py-3"><p className="text-xs font-bold text-brand-dark">Una buena presentación suele incluir</p><p className="mt-1 text-xs leading-5 text-secondary">Tu situación actual, fecha aproximada para mudarte, rutina diaria y por qué te interesa esta comunidad.</p></div>
          </> : <div className="mt-4 rounded-[18px] border border-black/[0.06] bg-white p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white">{[user?.first_name, user?.last_name].filter(Boolean).map((part) => part?.[0]).join("").slice(0, 2).toUpperCase() || "CF"}</span><span><span className="block text-sm font-bold text-brand-dark">{[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Tu perfil"}</span><span className="block text-xs text-secondary">{user?.rental_budget != null ? `Presupuesto: hasta ${user.rental_budget.toLocaleString("es-ES")} €/mes` : "Presupuesto no indicado"}</span></span></div><p className="mt-4 whitespace-pre-wrap rounded-[12px] bg-[#f3f5f3] px-3.5 py-3 text-sm leading-6 text-secondary">{message.trim()}</p><p className="mt-3 text-[10px] leading-4 text-muted">El administrador podrá abrir tu perfil para revisar tus datos públicos y preferencias de convivencia.</p></div>}

          {!reviewing && <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escribe una breve presentación: quién eres, tu situación actual y por qué te gustaría unirte..."
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            disabled={submitting}
            className="mt-4 w-full resize-none rounded-[16px] border border-black/[0.08] bg-white px-4 py-3 text-sm leading-6 text-brand-dark outline-none transition focus:border-primary/40 focus:ring-3 focus:ring-primary/8 disabled:opacity-60"
          />}

          {!reviewing && <p className="mt-1 text-right text-xs text-muted">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </p>}

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
              {submitting ? "Enviando..." : reviewing ? "Confirmar y enviar" : "Revisar solicitud"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (reviewing) setReviewing(false);
                else setShowForm(false);
                setError("");
              }}
              disabled={submitting}
              className="flex h-12 flex-1 items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-brand-dark transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reviewing ? "Volver a editar" : "Cancelar"}
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

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[13px] bg-white px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p><p className="mt-1 text-xs font-bold text-brand-dark">{value}</p></div>;
}

function getPreferenceComparisons(
  community: Community,
  preferences: { cleanliness?: string; visits?: string; smoking?: string; pets?: string; lifestyle?: string } | null
) {
  if (!community.preferences || !preferences) return [];
  const fields = [
    ["Limpieza", "cleanliness"],
    ["Visitas", "visits"],
    ["Tabaco", "smoking"],
    ["Mascotas", "pets"],
    ["Convivencia", "lifestyle"],
  ] as const;
  return fields.flatMap(([label, key]) => {
    const communityValue = community.preferences?.[key];
    const userValue = preferences[key];
    if (!communityValue || !userValue) return [];
    return [{ label, communityValue, matches: normalizePreference(communityValue) === normalizePreference(userValue) }];
  });
}

function normalizePreference(value: string) {
  return value.trim().toLocaleLowerCase("es");
}
