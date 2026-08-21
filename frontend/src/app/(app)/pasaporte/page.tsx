"use client";

import PassportCard from "@/components/pasaporte/PassportCard";
import { useAuth } from "@/hooks/useAuth";
import type { SolvencyPassport } from "@/types/solvencyPassport";

const LOCAL_PASSPORT_PREVIEW: SolvencyPassport = {
  id: "local-preview",
  public_id: "CFP-LOCAL-PREVIEW",
  status: "ISSUED",
  algorithm_version: "1.0",
  issued_at: "2026-08-20T10:00:00.000Z",
  expires_at: "2027-02-20T10:00:00.000Z",
  revoked_at: null,
  is_sandbox: true,
  currency: "EUR",
  analysis_period_start: "2026-02-01T00:00:00.000Z",
  analysis_period_end: "2026-07-31T23:59:59.000Z",
  months_analyzed: 6,
  recurring_monthly_income: "1750.00",
  average_fixed_expenses: "520.00",
  average_variable_expenses: "280.00",
  average_monthly_margin: "950.00",
  recommended_rent_capacity: "700.00",
  income_stability: "HIGH",
  confidence_level: "HIGH",
  created_at: "2026-08-20T10:00:00.000Z",
  share_url: "#",
};

export default function PasaportePage() {
  const { user } = useAuth();

  return (
    <main className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-[#cbd5d1] px-4 pt-16 sm:px-8 sm:pt-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_4%,rgba(255,255,255,0.58),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_58%)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl">
        <PassportCard
          passport={LOCAL_PASSPORT_PREVIEW}
          comparisonRent={650}
          holderName={
            user
              ? `${user.first_name} ${user.last_name.slice(0, 1)}.`
              : "Mi pasaporte"
          }
        />
      </div>
    </main>
  );
}
