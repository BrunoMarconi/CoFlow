"use client";

import { useState } from "react";
import axios from "axios";
import { formatEuros } from "@/lib/money";
import {
  downloadSolvencyPassportPdf,
  issueSolvencyPassport,
  regenerateSolvencyPassportShareLink,
  revokeSolvencyPassport,
} from "@/services/solvencyPassports";
import type { SolvencyPassport } from "@/types/solvencyPassport";

const STATUS_LABELS: Record<string, string> = {
  ISSUED: "Vigente",
  EXPIRED: "Caducado",
  REVOKED: "Revocado",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function SolvencyPassportSection({
  passport,
  onChange,
  canIssue,
}: {
  passport: SolvencyPassport | null;
  onChange: (passport: SolvencyPassport) => void;
  canIssue: boolean;
}) {
  const [issuing, setIssuing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleIssue() {
    if (issuing) return;
    setIssuing(true);
    setError("");

    try {
      const data = await issueSolvencyPassport();
      onChange(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "No pudimos emitir el pasaporte. Inténtalo de nuevo.")
      );
    } finally {
      setIssuing(false);
    }
  }

  async function handleDownloadPdf() {
    if (!passport || downloading) return;
    setDownloading(true);
    setError("");

    try {
      const blob = await downloadSolvencyPassportPdf(passport.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${passport.public_id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        extractErrorMessage(err, "No pudimos descargar el PDF. Inténtalo de nuevo.")
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyLink() {
    if (!passport) return;
    try {
      await navigator.clipboard.writeText(passport.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("No pudimos copiar el enlace.");
    }
  }

  function handleViewPublicPage() {
    if (!passport) return;
    window.open(passport.share_url, "_blank", "noopener,noreferrer");
  }

  async function handleRegenerate() {
    if (!passport || regenerating) return;
    if (
      !window.confirm(
        "Esto invalidará el enlace actual. Cualquier persona que ya lo tenga dejará de poder verificarlo. ¿Continuar?"
      )
    ) {
      return;
    }

    setRegenerating(true);
    setError("");

    try {
      const data = await regenerateSolvencyPassportShareLink(passport.id);
      onChange(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "No pudimos regenerar el enlace. Inténtalo de nuevo.")
      );
    } finally {
      setRegenerating(false);
    }
  }

  async function handleRevoke() {
    if (!passport || revoking) return;
    if (
      !window.confirm(
        "Esto revocará el pasaporte de forma permanente y dejará de ser válido. ¿Continuar?"
      )
    ) {
      return;
    }

    setRevoking(true);
    setError("");

    try {
      const data = await revokeSolvencyPassport(passport.id);
      onChange(data);
    } catch (err) {
      setError(
        extractErrorMessage(err, "No pudimos revocar el pasaporte. Inténtalo de nuevo.")
      );
    } finally {
      setRevoking(false);
    }
  }

  if (!canIssue) return null;

  return (
    <div className="mt-6">
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      {!passport ? (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-lg font-bold text-foreground">
            Emite tu Pasaporte de Solvencia
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Genera un documento verificable con tu capacidad orientativa
            para compartir con propietarios o inmobiliarias. Gratuito
            mientras estamos en pruebas con datos de sandbox.
          </p>

          <button
            type="button"
            onClick={handleIssue}
            disabled={issuing}
            className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {issuing ? "Emitiendo…" : "Emitir pasaporte de prueba"}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">
              Pasaporte de Solvencia
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                passport.status === "ISSUED"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {STATUS_LABELS[passport.status] ?? passport.status}
            </span>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted">Capacidad orientativa</dt>
              <dd className="font-bold text-foreground">
                {passport.recommended_rent_capacity !== null
                  ? `Hasta ${formatEuros(passport.recommended_rent_capacity)}/mes`
                  : "Sin estimación"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted">Emitido</dt>
              <dd className="font-bold text-foreground">
                {formatDate(passport.issued_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted">Caduca</dt>
              <dd className="font-bold text-foreground">
                {formatDate(passport.expires_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-muted">Algoritmo</dt>
              <dd className="font-bold text-foreground">
                v{passport.algorithm_version}
              </dd>
            </div>
          </dl>

          {passport.status !== "ISSUED" && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
              Este pasaporte ya no es válido. No lo compartas como
              documento vigente.
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex h-12 items-center justify-center rounded-2xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? "Descargando…" : "Descargar PDF"}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              disabled={passport.status !== "ISSUED"}
              className="flex h-12 items-center justify-center rounded-2xl border border-line bg-white text-sm font-bold text-foreground transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copied ? "¡Copiado!" : "Copiar enlace verificable"}
            </button>

            <button
              type="button"
              onClick={handleViewPublicPage}
              disabled={passport.status !== "ISSUED"}
              className="flex h-12 items-center justify-center rounded-2xl border border-line bg-white text-sm font-bold text-foreground transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Ver página pública
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={passport.status !== "ISSUED" || regenerating}
              className="flex h-12 items-center justify-center rounded-2xl border border-line bg-white text-sm font-bold text-foreground transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {regenerating ? "Regenerando…" : "Regenerar enlace"}
            </button>
          </div>

          {passport.status === "ISSUED" && (
            <button
              type="button"
              onClick={handleRevoke}
              disabled={revoking}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-red-100 bg-white text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {revoking ? "Revocando…" : "Revocar pasaporte"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
