export type FinancialAnalysisStatus =
  | "PENDING"
  | "ANALYZING"
  | "COMPLETED"
  | "INSUFFICIENT_DATA"
  | "FAILED"
  | "OUTDATED";

export type IncomeStability = "LOW" | "MEDIUM" | "HIGH";
export type AnalysisConfidence = "LOW" | "MEDIUM" | "HIGH";

// Los importes llegan como string (serializados desde Decimal en el
// backend) para no perder precisión monetaria — nunca aritmética en el
// cliente, solo formateo para mostrar.
export interface FinancialAnalysis {
  id: string;
  status: FinancialAnalysisStatus;
  algorithm_version: string;

  analysis_period_start: string | null;
  analysis_period_end: string | null;
  months_analyzed: number;
  accounts_analyzed: number;
  transactions_analyzed: number;

  average_monthly_income: string | null;
  median_monthly_income: string | null;
  recurring_monthly_income: string | null;
  average_monthly_fixed_expenses: string | null;
  average_monthly_variable_expenses: string | null;
  average_monthly_outflows: string | null;
  average_monthly_net_margin: string | null;

  average_balance: string | null;
  minimum_balance: string | null;
  months_with_negative_balance: number;

  income_stability: IncomeStability | null;
  analysis_confidence: AnalysisConfidence | null;
  recommended_monthly_rent: string | null;

  result_summary: string;
  failure_reason: string | null;

  calculated_at: string | null;
  created_at: string;
  is_sandbox: boolean;
}

export interface FinancialMonthlySummary {
  year: number;
  month: number;
  total_income: string;
  recurring_income: string;
  total_fixed_expenses: string;
  total_variable_expenses: string;
  total_outflows: string;
  net_margin: string;
  closing_balance: string | null;
  income_sources_count: number;
}
