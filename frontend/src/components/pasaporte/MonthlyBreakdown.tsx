"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatEuros, formatMonthLabel } from "@/lib/money";
import type { FinancialMonthlySummary } from "@/types/financialAnalysis";

export default function MonthlyBreakdown({
  months,
}: {
  months: FinancialMonthlySummary[];
}) {
  const [hidden, setHidden] = useState(false);

  if (months.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Detalle mensual</h3>
        <button
          type="button"
          onClick={() => setHidden((v) => !v)}
          className="text-xs font-semibold text-brand"
        >
          {hidden ? "Mostrar importes" : "Ocultar importes"}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {months.map((m) => (
          <div
            key={`${m.year}-${m.month}`}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <p className="text-sm font-bold text-foreground">
              {formatMonthLabel(m.year, m.month)}
            </p>

            <div
              className={cn(
                "mt-2 grid grid-cols-2 gap-y-1 text-xs",
                hidden && "blur-sm select-none"
              )}
            >
              <span className="text-muted">Ingresos válidos</span>
              <span className="text-right font-semibold text-foreground">
                {formatEuros(m.total_income)}
              </span>
              <span className="text-muted">Gastos fijos</span>
              <span className="text-right font-semibold text-foreground">
                {formatEuros(m.total_fixed_expenses)}
              </span>
              <span className="text-muted">Gastos variables</span>
              <span className="text-right font-semibold text-foreground">
                {formatEuros(m.total_variable_expenses)}
              </span>
              <span className="text-muted">Margen</span>
              <span className="text-right font-semibold text-foreground">
                {formatEuros(m.net_margin)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
