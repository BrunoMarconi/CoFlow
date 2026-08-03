import type { AnalysisConfidence, IncomeStability } from "./financialAnalysis";

export type SolvencyPassportStatus = "ISSUED" | "EXPIRED" | "REVOKED";

export interface SolvencyPassport {
  id: string;
  public_id: string;
  status: SolvencyPassportStatus;
  algorithm_version: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  is_sandbox: boolean;
  currency: string;
  analysis_period_start: string | null;
  analysis_period_end: string | null;
  months_analyzed: number;
  recurring_monthly_income: string | null;
  average_fixed_expenses: string | null;
  average_variable_expenses: string | null;
  average_monthly_margin: string | null;
  recommended_rent_capacity: string | null;
  income_stability: IncomeStability;
  confidence_level: AnalysisConfidence;
  created_at: string;
  share_url: string;
}

export interface PublicSolvencyPassport {
  public_id: string;
  status: SolvencyPassportStatus;
  holder_initials: string;
  issued_at: string;
  expires_at: string;
  is_sandbox: boolean;
  currency: string;
  analysis_period_start: string | null;
  analysis_period_end: string | null;
  months_analyzed: number;
  recommended_rent_capacity: string | null;
  income_stability: IncomeStability;
  confidence_level: AnalysisConfidence;
  algorithm_version: string;
  legal_notice: string;
  sandbox_notice: string | null;
}
