import { formatEuros } from "@/lib/money";
import type {
  AnalysisConfidence,
  FinancialAnalysis,
  IncomeStability,
} from "@/types/financialAnalysis";

const STABILITY_LABELS: Record<IncomeStability, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

const CONFIDENCE_LABELS: Record<AnalysisConfidence, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatPeriod(start: string | null, end: string | null) {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);
  if (!startLabel || !endLabel) return null;
  return `${startLabel} – ${endLabel}`;
}

function SandboxNotice() {
  return (
    <p className="mb-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
      Datos bancarios de prueba. Este resultado no representa una
      evaluación financiera real.
    </p>
  );
}

export default function FinancialAnalysisResult({
  analysis,
}: {
  analysis: FinancialAnalysis;
}) {
  if (analysis.status === "INSUFFICIENT_DATA") {
    return (
      <div>
        {analysis.is_sandbox && <SandboxNotice />}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-foreground">
            Datos insuficientes
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {analysis.failure_reason ??
              "Todavía no hay suficiente historial de movimientos para un análisis fiable."}
          </p>
        </div>
      </div>
    );
  }

  if (analysis.status === "FAILED") {
    return (
      <div>
        {analysis.is_sandbox && <SandboxNotice />}
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-foreground">
            No pudimos completar el análisis
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {analysis.failure_reason ?? "Inténtalo de nuevo en unos minutos."}
          </p>
        </div>
      </div>
    );
  }

  if (analysis.status !== "COMPLETED") {
    return null;
  }

  const period = formatPeriod(
    analysis.analysis_period_start,
    analysis.analysis_period_end
  );
  const calculatedAt = formatDate(analysis.calculated_at);

  return (
    <div>
      {analysis.is_sandbox && <SandboxNotice />}
      <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-lg font-bold text-foreground">
        Tu análisis financiero
      </h2>
      {period && (
        <p className="mt-1 text-sm text-muted">Periodo analizado: {period}</p>
      )}

      <div className="mt-5 rounded-2xl bg-brand/5 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">
          Capacidad orientativa
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">
          {analysis.recommended_monthly_rent !== null
            ? `Hasta ${formatEuros(analysis.recommended_monthly_rent)}/mes`
            : "Sin estimación disponible"}
        </p>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <Row
          label="Ingresos recurrentes medios"
          value={formatEuros(analysis.recurring_monthly_income)}
        />
        <Row
          label="Estabilidad de ingresos"
          value={
            analysis.income_stability
              ? STABILITY_LABELS[analysis.income_stability]
              : "—"
          }
        />
        <Row
          label="Gastos fijos estimados"
          value={formatEuros(analysis.average_monthly_fixed_expenses)}
        />
        <Row
          label="Margen mensual medio"
          value={formatEuros(analysis.average_monthly_net_margin)}
        />
        <Row
          label="Confianza del análisis"
          value={
            analysis.analysis_confidence
              ? CONFIDENCE_LABELS[analysis.analysis_confidence]
              : "—"
          }
        />
        {calculatedAt && <Row label="Calculado el" value={calculatedAt} />}
      </dl>

      {analysis.analysis_confidence === "LOW" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
          Estimación con confianza baja: hay pocos datos o son poco
          consistentes, así que la cifra anterior es conservadora.
        </p>
      )}

      <p className="mt-5 text-xs leading-5 text-muted">
        {analysis.result_summary}
      </p>
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
