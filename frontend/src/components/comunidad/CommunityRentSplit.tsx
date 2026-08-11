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
      <div className="rounded-18 border border-border bg-surface p-6 text-center text-sm text-muted">
        Cargando el reparto del alquiler...
      </div>
    );
  }

  if (error || !split) {
    return (
      <div className="rounded-18 border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-600">
        {error || "No pudimos cargar el reparto del alquiler."}
      </div>
    );
  }

  const remaining = split.remaining_amount;

  return (
    <section className="rounded-18 border border-border bg-surface p-5 shadow-soft sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        Reparto del alquiler
      </p>

      <p className="mt-2 text-sm leading-6 text-muted">
        El reparto individual solo es visible para los miembros de la
        comunidad.
      </p>

      <div className="mt-4 rounded-18 bg-surface-muted p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">Alquiler total</span>
          <span className="font-bold text-brand-dark">
            {split.total_monthly_rent !== null
              ? formatEuros(split.total_monthly_rent)
              : "Sin definir"}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-muted">Aportaciones configuradas</span>
          <span className="font-bold text-brand-dark">
            {formatEuros(split.total_configured)}
          </span>
        </div>

        {remaining !== null && (
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-muted">
              {remaining < 0 ? "Superan el alquiler total en" : "Faltan por repartir"}
            </span>
            <span
              className={`font-bold ${
                remaining < 0
                  ? "text-red-600"
                  : remaining === 0
                    ? "text-primary-dark"
                    : "text-brand-dark"
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
            className="flex items-center justify-between gap-3 rounded-18 border border-border bg-surface-muted p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-dark">
                {contribution.first_name} {contribution.last_name}
                {contribution.role === "OWNER" && (
                    <span className="ml-2 rounded-full border border-primary/20 bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-primary-dark shadow-soft">
                    Administrador
                  </span>
                )}
              </p>

              <p className="mt-1 text-xs text-muted">
                Aportación mensual: cantidad que esta persona paga
                actualmente dentro de la comunidad.
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-brand-dark">
                {contribution.monthly_contribution !== null
                  ? formatEuros(contribution.monthly_contribution)
                  : "No configurado"}
              </p>

              <p className="text-xs text-muted">
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
