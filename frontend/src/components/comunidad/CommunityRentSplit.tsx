"use client";

import { useEffect, useState } from "react";
import { getCommunityRentSplit } from "@/services/communities";
import type { CommunityRentSplit as CommunityRentSplitType } from "@/types/community";

function formatEuros(value: number) {
  return `${value.toLocaleString("es-ES")} €`;
}

export default function CommunityRentSplit({
  communityId,
}: {
  communityId: number;
}) {
  const [split, setSplit] = useState<CommunityRentSplitType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getCommunityRentSplit(communityId)
      .then((data) => {
        if (active) setSplit(data);
      })
      .catch(() => {
        if (active) setError("No pudimos cargar el reparto del alquiler.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [communityId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
        Cargando el reparto del alquiler...
      </div>
    );
  }

  if (error || !split) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">
        {error || "No pudimos cargar el reparto del alquiler."}
      </div>
    );
  }

  const remaining = split.remaining_amount;

  return (
    <section className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-600">
        Reparto del alquiler
      </p>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        El reparto individual solo es visible para los miembros de la
        comunidad.
      </p>

      <div className="mt-4 rounded-2xl bg-[#F8FAFC] p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Alquiler total</span>
          <span className="font-bold text-[#163B2E]">
            {split.total_monthly_rent !== null
              ? formatEuros(split.total_monthly_rent)
              : "Sin definir"}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-gray-500">Aportaciones configuradas</span>
          <span className="font-bold text-[#163B2E]">
            {formatEuros(split.total_configured)}
          </span>
        </div>

        {remaining !== null && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-gray-500">
              {remaining < 0 ? "Superan el alquiler total en" : "Faltan por repartir"}
            </span>
            <span
              className={`font-bold ${
                remaining < 0
                  ? "text-red-600"
                  : remaining === 0
                    ? "text-green-700"
                    : "text-[#163B2E]"
              }`}
            >
              {formatEuros(Math.abs(remaining))}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {split.contributions.map((contribution) => (
          <div
            key={contribution.member_id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#163B2E]">
                {contribution.first_name} {contribution.last_name}
                {contribution.role === "OWNER" && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-800">
                    Administrador
                  </span>
                )}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Aportación mensual: cantidad que esta persona paga
                actualmente dentro de la comunidad.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-[#163B2E]">
                {contribution.monthly_contribution !== null
                  ? formatEuros(contribution.monthly_contribution)
                  : "No configurado"}
              </p>

              <p className="text-xs text-gray-400">
                {contribution.contribution_percentage !== null
                  ? `${contribution.contribution_percentage} %`
                  : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
