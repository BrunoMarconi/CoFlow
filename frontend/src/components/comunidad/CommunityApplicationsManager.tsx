"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  acceptApplication,
  getCommunityApplications,
  rejectApplication,
} from "@/services/applications";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { CommunityApplication } from "@/types/application";

export default function CommunityApplicationsManager({
  communityId,
}: {
  communityId: number;
}) {
  const { refreshCommunity } = useAuth();

  const [applications, setApplications] = useState<CommunityApplication[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;

    getCommunityApplications(communityId)
      .then((data) => {
        if (active) setApplications(data);
      })
      .catch(() => {
        if (active) setLoadError("No pudimos cargar las solicitudes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [communityId]);

  const pendingCount = applications.filter(
    (application) => application.status === "PENDING"
  ).length;

  async function handleAccept(applicationId: number) {
    if (actioningId) return;

    setActioningId(applicationId);
    setActionError("");

    try {
      const updated = await acceptApplication(applicationId);

      setApplications((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      await refreshCommunity();
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "No pudimos aceptar la solicitud. Inténtalo de nuevo."
        )
      );
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(applicationId: number) {
    if (actioningId) return;

    setActioningId(applicationId);
    setActionError("");

    try {
      const updated = await rejectApplication(applicationId);

      setApplications((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "No pudimos rechazar la solicitud. Inténtalo de nuevo."
        )
      );
    } finally {
      setActioningId(null);
    }
  }

  return (
    <section className="rounded-24 border border-border bg-surface p-4 shadow-soft sm:p-6">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Solicitudes
        </p>

        {pendingCount > 0 && (
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
            {pendingCount}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm leading-6 text-muted">
        Esta solicitud es para ocupar una plaza abierta en la comunidad.
        El administrador revisa el perfil antes de decidir.
      </p>

      {actionError && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          {actionError}
        </p>
      )}

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-center text-sm text-muted">Cargando...</p>
        ) : loadError ? (
          <p className="text-center text-sm font-semibold text-red-600">
            {loadError}
          </p>
        ) : applications.length === 0 ? (
        <p className="rounded-18 border border-dashed border-border bg-surface p-6 text-center text-sm text-secondary">
            Todavía no habéis recibido solicitudes.
          </p>
        ) : (
          applications.map((application) => (
            <ApplicationRow
              key={application.id}
              application={application}
              actioning={actioningId === application.id}
              onAccept={() => handleAccept(application.id)}
              onReject={() => handleReject(application.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};

const PREFERENCE_LABELS: Record<
  keyof NonNullable<CommunityApplication["applicant"]["preferences"]>,
  string
> = {
  cleanliness: "Limpieza",
  lifestyle: "Convivencia",
  smoking: "Tabaco",
  pets: "Mascotas",
};

function ApplicationRow({
  application,
  actioning,
  onAccept,
  onReject,
}: {
  application: CommunityApplication;
  actioning: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const [confirming, setConfirming] = useState<"accept" | "reject" | null>(
    null
  );

  const fullName =
    `${application.applicant.first_name} ${application.applicant.last_name}`.trim();

  const initials = [
    application.applicant.first_name,
    application.applicant.last_name,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const budgetLabel =
    application.applicant.rental_budget !== null
      ? `Hasta ${application.applicant.rental_budget.toLocaleString("es-ES")} €/mes`
      : "Presupuesto no indicado";

  return (
    <div className="rounded-18 border border-border bg-surface p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/8 text-sm font-semibold text-primary-dark">
          {initials || "CF"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/personas/${application.applicant.id}`}
              className="truncate text-sm font-semibold text-foreground hover:underline"
            >
              {fullName || "Persona de CoFlow"}
            </Link>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                application.status === "PENDING"
                  ? "bg-primary/8 text-primary-dark"
                  : "bg-surface-soft text-secondary"
              }`}
            >
              {STATUS_LABELS[application.status] ?? application.status}
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-muted">
            {budgetLabel}
          </p>

          {application.applicant.preferences && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(
                Object.keys(PREFERENCE_LABELS) as Array<
                  keyof typeof PREFERENCE_LABELS
                >
              ).map((key) => (
                <span
                  key={key}
                  className="rounded-full bg-surface-soft px-2.5 py-1 text-[10px] font-medium text-secondary"
                >
                  {PREFERENCE_LABELS[key]}:{" "}
                  {application.applicant.preferences?.[key]}
                </span>
              ))}
            </div>
          )}

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary">
            {application.message}
          </p>

          <p className="mt-2 text-xs text-muted">
            {formatDate(application.created_at)}
          </p>
        </div>
      </div>

      {application.status === "PENDING" && confirming === null && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setConfirming("accept")}
            disabled={actioning}
            className="flex h-11 flex-1 items-center justify-center rounded-14 bg-primary text-sm font-semibold text-white shadow-button transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aceptar
          </button>

          <button
            type="button"
            onClick={() => setConfirming("reject")}
            disabled={actioning}
            className="flex h-11 flex-1 items-center justify-center rounded-14 border border-border bg-surface text-sm font-semibold text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      )}

      {application.status === "PENDING" && confirming === "accept" && (
        <div className="mt-4 rounded-14 bg-primary/6 p-3.5">
          <p className="text-sm font-bold text-brand-dark">
            ¿Quieres aceptar a esta persona?
          </p>

          <p className="mt-1 text-xs leading-5 text-muted">
            Se convertirá en miembro, podrá acceder al chat grupal y se
            reducirá una plaza abierta.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onAccept}
              disabled={actioning}
              className="flex h-11 flex-1 items-center justify-center rounded-14 bg-primary text-sm font-semibold text-white shadow-button transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actioning ? "Procesando..." : "Sí, aceptar"}
            </button>

            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={actioning}
              className="flex h-11 flex-1 items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-brand-dark transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {application.status === "PENDING" && confirming === "reject" && (
        <div className="mt-4 rounded-14 border border-red-200 bg-surface p-3.5">
          <p className="text-sm font-bold text-brand-dark">
            ¿Quieres rechazar esta solicitud?
          </p>

          <p className="mt-1 text-xs leading-5 text-muted">
            La persona no se unirá a la comunidad. Podrás recibir nuevas
            solicitudes mientras queden plazas abiertas.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onReject}
              disabled={actioning}
              className="flex h-11 flex-1 items-center justify-center rounded-14 border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actioning ? "Procesando..." : "Sí, rechazar"}
            </button>

            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={actioning}
              className="flex h-11 flex-1 items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-brand-dark transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
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
