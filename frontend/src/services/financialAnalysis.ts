import { api } from "./api";
import type {
  FinancialAnalysis,
  FinancialMonthlySummary,
} from "@/types/financialAnalysis";

export async function runFinancialAnalysis() {
  const { data } = await api.post<FinancialAnalysis>("/financial-analysis/run");
  return data;
}

export async function refreshFinancialAnalysis() {
  const { data } = await api.post<FinancialAnalysis>(
    "/financial-analysis/refresh"
  );
  return data;
}

export async function getMyFinancialAnalysis() {
  const { data } = await api.get<FinancialAnalysis>("/financial-analysis/me");
  return data;
}

export async function getMyFinancialAnalysisMonthly() {
  const { data } = await api.get<FinancialMonthlySummary[]>(
    "/financial-analysis/me/monthly"
  );
  return data;
}
