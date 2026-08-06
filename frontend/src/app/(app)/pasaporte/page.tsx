"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Spinner from "@/components/ui/Spinner";
import FinancialAnalysisResult from "@/components/pasaporte/FinancialAnalysisResult";
import HowWeCalculateIt from "@/components/pasaporte/HowWeCalculateIt";
import MonthlyBreakdown from "@/components/pasaporte/MonthlyBreakdown";
import SolvencyPassportSection from "@/components/pasaporte/SolvencyPassportSection";
import {
  disconnectBankConnection,
  getMyBankConnection,
  startBankConnection,
  syncBankConnection,
} from "@/services/bankConnections";
import {
  getMyFinancialAnalysis,
  getMyFinancialAnalysisMonthly,
  refreshFinancialAnalysis,
  runFinancialAnalysis,
} from "@/services/financialAnalysis";
import { getMySolvencyPassport } from "@/services/solvencyPassports";
import type { BankConnectionSummary } from "@/types/bankConnection";
import type {
  FinancialAnalysis,
  FinancialMonthlySummary,
} from "@/types/financialAnalysis";
import type { SolvencyPassport } from "@/types/solvencyPassport";

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

export default function PasaportePage() {
  const [summary, setSummary] = useState<BankConnectionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [actionError, setActionError] = useState("");

  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [monthly, setMonthly] = useState<FinancialMonthlySummary[]>([]);

  const [passport, setPassport] = useState<SolvencyPassport | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await getMyBankConnection();
      setSummary(data);
    } catch {
      setSummary({
        connected: false,
        connection_id: null,
        provider_name: null,
        status: null,
        connected_at: null,
        last_synced_at: null,
        consent_expires_at: null,
        accounts_count: 0,
        transactions_count: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getMyBankConnection()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) {
          setSummary({
            connected: false,
            connection_id: null,
            provider_name: null,
            status: null,
            connected_at: null,
            last_synced_at: null,
            consent_expires_at: null,
            accounts_count: 0,
            transactions_count: 0,
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (summary?.status !== "CONNECTED") return;

    let active = true;

    Promise.resolve()
      .then(() => {
        if (active) setAnalysisLoading(true);
        return getMyFinancialAnalysis();
      })
      .then(async (data) => {
        if (!active) return;
        setAnalysis(data);
        if (data.status === "COMPLETED") {
          const months = await getMyFinancialAnalysisMonthly();
          if (active) setMonthly(months);
        } else {
          setMonthly([]);
        }
      })
      .catch(() => {
        if (active) {
          setAnalysis(null);
          setMonthly([]);
        }
      })
      .finally(() => {
        if (active) setAnalysisLoading(false);
      });

    return () => {
      active = false;
    };
  }, [summary?.status]);

  useEffect(() => {
    if (analysis?.status !== "COMPLETED") return;

    let active = true;

    getMySolvencyPassport()
      .then((data) => {
        if (active) setPassport(data);
      })
      .catch(() => {
        if (active) setPassport(null);
      });

    return () => {
      active = false;
    };
  }, [analysis?.status]);

  async function handleConnect() {
    if (connecting) return;

    setConnecting(true);
    setActionError("");

    try {
      const { authorization_url } = await startBankConnection();
      window.location.href = authorization_url;
    } catch (error) {
      setActionError(
        extractErrorMessage(
          error,
          "No pudimos iniciar la conexión con tu banco. Inténtalo de nuevo."
        )
      );
      setConnecting(false);
    }
  }

  async function handleSync() {
    if (syncing || !summary?.connection_id) return;

    setSyncing(true);
    setActionError("");

    try {
      await syncBankConnection(summary.connection_id);
      await loadSummary();
    } catch (error) {
      setActionError(
        extractErrorMessage(
          error,
          "No pudimos actualizar tus datos bancarios. Inténtalo de nuevo."
        )
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (disconnecting || !summary?.connection_id) return;

    setDisconnecting(true);
    setActionError("");

    try {
      await disconnectBankConnection(summary.connection_id);
      await loadSummary();
      setAnalysis(null);
      setMonthly([]);
    } catch (error) {
      setActionError(
        extractErrorMessage(
          error,
          "No pudimos desconectar tu banco. Inténtalo de nuevo."
        )
      );
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleRunAnalysis() {
    if (analyzing) return;

    setAnalyzing(true);
    setAnalysisError("");

    try {
      const data = await runFinancialAnalysis();
      setAnalysis(data);
      if (data.status === "COMPLETED") {
        const months = await getMyFinancialAnalysisMonthly();
        setMonthly(months);
      }
    } catch (error) {
      setAnalysisError(
        extractErrorMessage(
          error,
          "No pudimos analizar tus datos bancarios. Inténtalo de nuevo."
        )
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleRefreshAnalysis() {
    if (analyzing) return;

    setAnalyzing(true);
    setAnalysisError("");

    try {
      const data = await refreshFinancialAnalysis();
      setAnalysis(data);
      if (data.status === "COMPLETED") {
        const months = await getMyFinancialAnalysisMonthly();
        setMonthly(months);
      } else {
        setMonthly([]);
      }
    } catch (error) {
      setAnalysisError(
        extractErrorMessage(
          error,
          "No pudimos actualizar tu análisis. Inténtalo de nuevo."
        )
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
        Pasaporte de Solvencia
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Verifica tu capacidad económica
      </h1>

      <p className="mt-3 text-base leading-7 text-muted">
        Presenta tu comunidad con más confianza ante propietarios e
        inmobiliarias.
      </p>

      <div className="mt-6 flex items-baseline gap-3 rounded-18 border border-line bg-surface px-5 py-4">
        <span className="text-2xl font-bold text-foreground">20 €</span>
        <span className="text-sm font-semibold text-muted">
          por emisión · válido durante 90 días
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="mt-8">
          {actionError && (
            <p
              role="alert"
              className="mb-5 rounded-18 border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {actionError}
            </p>
          )}

          {!summary || (!summary.connected && summary.status !== "PENDING") ? (
            <div className="rounded-18 border border-line bg-surface p-6">
              <h2 className="text-lg font-bold text-foreground">
                Conecta tu banco para empezar
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Conectamos tu banco de forma segura a través de TrueLayer
                para leer tus cuentas, saldos y movimientos recientes.
              </p>

              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-18 bg-brand text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
              >
                {connecting ? "Conectando…" : "Conectar mi banco"}
              </button>
            </div>
          ) : summary.status === "PENDING" ? (
            <div className="rounded-18 border border-line bg-surface p-6">
              <h2 className="text-lg font-bold text-foreground">
                Conexión pendiente
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Estamos esperando a que termines el proceso de conexión con
                tu banco.
              </p>

              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="mt-6 flex h-14 w-full items-center justify-center rounded-18 bg-brand text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
              >
                {connecting ? "Conectando…" : "Continuar conexión"}
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-18 border border-line bg-surface p-6">
                <h2 className="text-lg font-bold text-foreground">
                  Banco conectado
                  {summary.provider_name ? `: ${summary.provider_name}` : ""}
                </h2>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-muted">
                      Conectado desde
                    </dt>
                    <dd className="font-bold text-foreground">
                      {formatDate(summary.connected_at) ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-muted">
                      Última sincronización
                    </dt>
                    <dd className="font-bold text-foreground">
                      {formatDate(summary.last_synced_at) ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-muted">Cuentas</dt>
                    <dd className="font-bold text-foreground">
                      {summary.accounts_count}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-semibold text-muted">Movimientos</dt>
                    <dd className="font-bold text-foreground">
                      {summary.transactions_count}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex h-12 w-full items-center justify-center rounded-18 border border-line bg-surface text-sm font-bold text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                  >
                    {syncing ? "Actualizando…" : "Actualizar datos"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="flex h-12 w-full items-center justify-center rounded-18 border border-red-100 bg-surface text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                  >
                    {disconnecting ? "Desconectando…" : "Desconectar"}
                  </button>
                </div>
              </div>

              <div className="mt-6">
                {analysisError && (
                  <p
                    role="alert"
                    className="mb-5 rounded-18 border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    {analysisError}
                  </p>
                )}

                {analysisLoading ? (
                  <div className="flex min-h-[20vh] items-center justify-center">
                    <Spinner />
                  </div>
                ) : analyzing ? (
                  <div className="rounded-18 border border-line bg-surface p-6 text-center">
                    <Spinner className="mx-auto" />
                    <p className="mt-4 text-sm font-semibold text-muted">
                      Estamos analizando tus datos bancarios
                    </p>
                  </div>
                ) : analysis ? (
                  <>
                    <FinancialAnalysisResult analysis={analysis} />

                    {analysis.status === "COMPLETED" && (
                      <>
                        <button
                          type="button"
                          onClick={handleRefreshAnalysis}
                          className="mt-4 flex h-12 w-full items-center justify-center rounded-18 border border-line bg-surface text-sm font-bold text-foreground transition hover:bg-surface-soft sm:w-auto sm:px-8"
                        >
                          Actualizar análisis
                        </button>

                        <HowWeCalculateIt />
                        <MonthlyBreakdown months={monthly} />

                        <SolvencyPassportSection
                          passport={passport}
                          onChange={setPassport}
                          canIssue={analysis.status === "COMPLETED"}
                        />
                      </>
                    )}

                    {analysis.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={handleRunAnalysis}
                        className="mt-4 flex h-12 w-full items-center justify-center rounded-18 bg-brand text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-brand-dark sm:w-auto sm:px-8"
                      >
                        Reintentar análisis
                      </button>
                    )}
                  </>
                ) : (
                  <div className="rounded-18 border border-line bg-surface p-6">
                    <h2 className="text-lg font-bold text-foreground">
                      Analiza tus datos
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Analizaremos los últimos meses para estimar ingresos
                      recurrentes, estabilidad y capacidad orientativa de
                      alquiler.
                    </p>

                    <button
                      type="button"
                      onClick={handleRunAnalysis}
                      className="mt-6 flex h-14 w-full items-center justify-center rounded-18 bg-brand text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-brand-dark sm:w-auto sm:px-8"
                    >
                      Analizar mis datos
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-8 space-y-3 rounded-18 bg-surface-soft p-5 text-sm leading-6 text-muted">
        <p>
          CoFlow no recibe tus claves bancarias. La conexión y el
          consentimiento se realizan mediante TrueLayer.
        </p>
        <p>
          Los propietarios no verán tus movimientos bancarios. Solo
          recibirán los indicadores incluidos en el pasaporte que decidas
          compartir.
        </p>
      </div>
    </div>
  );
}
