"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicSolvencyPassport } from "@/services/solvencyPassports";
import type { PublicSolvencyPassport } from "@/types/solvencyPassport";

const STATUS_LABELS: Record<string, string> = {
  ISSUED: "Vigente",
  EXPIRED: "Caducado",
  REVOKED: "Revocado",
};

const STABILITY_LABELS: Record<string, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

function formatMoney(value: string | null) {
  if (value === null) return "Sin estimación";
  const amount = Number(value);
  if (Number.isNaN(amount)) return "Sin estimación";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

type ViewState = "loading" | "found" | "not-found";

export default function VerificarPasaportePage() {
  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();

  const [view, setView] = useState<ViewState>("loading");
  const [passport, setPassport] = useState<PublicSolvencyPassport | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    let active = true;

    Promise.resolve()
      .then(() => {
        if (!token) {
          throw new Error("missing-token");
        }
        return getPublicSolvencyPassport(params.publicId, token);
      })
      .then((data) => {
        if (!active) return;
        setPassport(data);
        setView("found");
      })
      .catch(() => {
        if (active) setView("not-found");
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.publicId]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-surface-soft px-4 py-10 sm:items-center">
      <div className="w-full max-w-md rounded-18 border border-border bg-surface p-6 shadow-soft sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
          CoFlow
        </p>
        <h1 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
          Pasaporte de Solvencia
        </h1>

        {view === "loading" && (
          <p className="mt-6 text-sm text-muted">Verificando documento…</p>
        )}

        {view === "not-found" && (
          <p className="mt-6 rounded-18 border border-border bg-surface-soft px-4 py-3 text-sm font-semibold text-secondary">
            Documento no encontrado o enlace no válido.
          </p>
        )}

        {view === "found" && passport && (
          <>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-muted">
                {passport.holder_initials}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  passport.status === "ISSUED"
                    ? "bg-mint-100 text-primary-dark"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {STATUS_LABELS[passport.status] ?? passport.status}
              </span>
            </div>

            {passport.status !== "ISSUED" && (
              <p className="mt-4 rounded-14 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                Este documento ya no es válido. No debe considerarse
                vigente.
              </p>
            )}

            <div className="mt-5 rounded-18 bg-brand/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
                Capacidad orientativa
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {passport.recommended_rent_capacity !== null
                  ? `Hasta ${formatMoney(passport.recommended_rent_capacity)}/mes`
                  : "Sin estimación disponible"}
              </p>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Emitido" value={formatDate(passport.issued_at)} />
              <Row label="Caduca" value={formatDate(passport.expires_at)} />
              <Row
                label="Periodo analizado"
                value={
                  passport.analysis_period_start && passport.analysis_period_end
                    ? `${formatDate(passport.analysis_period_start)} – ${formatDate(passport.analysis_period_end)}`
                    : "—"
                }
              />
              <Row label="Meses analizados" value={String(passport.months_analyzed)} />
              <Row
                label="Estabilidad de ingresos"
                value={STABILITY_LABELS[passport.income_stability] ?? "—"}
              />
              <Row
                label="Confianza del análisis"
                value={CONFIDENCE_LABELS[passport.confidence_level] ?? "—"}
              />
              <Row label="Versión del algoritmo" value={`v${passport.algorithm_version}`} />
            </dl>

            {passport.sandbox_notice && (
              <p className="mt-5 rounded-14 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                {passport.sandbox_notice}
              </p>
            )}

            <p className="mt-4 text-xs leading-5 text-muted">
              {passport.legal_notice}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="font-semibold text-muted">{label}</dt>
      <dd className="font-bold text-foreground">{value}</dd>
    </div>
  );
}
