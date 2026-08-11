"use client";

import { useEffect, useState } from "react";
import {
  getCommunityRentSplit,
  updateCommunityRentSplit,
} from "@/services/communities";
import type { CommunityRentSplit } from "@/types/community";

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function formatEuros(value: number) {
  return `${value.toLocaleString("es-ES")} €`;
}

export default function CommunityRentSplitManager({
  communityId,
}: {
  communityId: number;
}) {
  const [split, setSplit] = useState<CommunityRentSplit | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [totalInput, setTotalInput] = useState("");
  const [contributionInputs, setContributionInputs] = useState<
    Record<number, string>
  >({});

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    getCommunityRentSplit(communityId)
      .then((data) => {
        if (!active) return;

        setSplit(data);
        setTotalInput(
          data.total_monthly_rent !== null
            ? String(data.total_monthly_rent)
            : ""
        );

        const inputs: Record<number, string> = {};

        data.contributions.forEach((contribution) => {
          inputs[contribution.member_id] =
            contribution.monthly_contribution !== null
              ? String(contribution.monthly_contribution)
              : "";
        });

        setContributionInputs(inputs);
      })
      .catch(() => {
        if (active) setLoadError("No pudimos cargar el reparto del alquiler.");
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
      <div className="p-4 text-center text-sm text-muted">
        Cargando el reparto del alquiler...
      </div>
    );
  }

  if (loadError || !split) {
    return (
      <div className="m-3 rounded-14 border border-red-100 bg-red-50 p-4 text-center text-sm font-semibold text-red-600">
        {loadError || "No pudimos cargar el reparto del alquiler."}
      </div>
    );
  }

  const totalNumber = parseAmount(totalInput);

  const totalConfigured = split.contributions.reduce((sum, contribution) => {
    const parsed = parseAmount(contributionInputs[contribution.member_id] ?? "");
    return sum + (parsed ?? 0);
  }, 0);

  const remaining = totalNumber !== null ? totalNumber - totalConfigured : null;

  const mismatch = remaining !== null && remaining !== 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || !split) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const updated = await updateCommunityRentSplit(communityId, {
        total_monthly_rent: totalNumber,
        contributions: split.contributions.map((contribution) => ({
          member_id: contribution.member_id,
          monthly_contribution: parseAmount(
            contributionInputs[contribution.member_id] ?? ""
          ),
        })),
      });

      setSplit(updated);
      setSaveSuccess(true);
    } catch {
      setSaveError(
        "No pudimos guardar el reparto del alquiler. Inténtalo de nuevo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-3 sm:p-4">
      <p className="text-sm leading-6 text-muted">
        Esta información solo es visible para los miembros de la
        comunidad. Indica cuánto aporta cada persona actualmente. El
        presupuesto personal de cada usuario no se utiliza para calcular
        este reparto.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="total-monthly-rent"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Alquiler total de la vivienda
          </label>

          <p className="mb-2 text-xs leading-5 text-muted">
            Es el importe mensual completo del alquiler, antes de
            repartirlo entre los miembros.
          </p>

          <div className="relative max-w-[220px]">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
              €
            </span>

            <input
              id="total-monthly-rent"
              type="number"
              inputMode="numeric"
              min={0}
              max={100000}
              value={totalInput}
              onChange={(event) => {
                setTotalInput(event.target.value);
                setSaveSuccess(false);
              }}
              placeholder="Ej. 1500"
              className="h-11 w-full rounded-14 border border-line bg-surface pl-9 pr-4 text-base text-foreground outline-none transition focus:border-brand"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted">
            Aportación mensual de cada miembro
          </p>

          {split.contributions.map((contribution) => (
            <div
              key={contribution.member_id}
              className="flex flex-col gap-2 rounded-14 border border-line bg-surface-soft p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {contribution.first_name} {contribution.last_name}
                  {contribution.role === "OWNER" && (
                    <span className="ml-2 rounded-full border border-primary/20 bg-surface px-2 py-0.5 text-[10px] font-bold uppercase text-primary-dark shadow-soft">
                      Administrador
                    </span>
                  )}
                </p>

                <p className="mt-1 text-xs text-muted">
                  {(() => {
                    const parsed = parseAmount(
                      contributionInputs[contribution.member_id] ?? ""
                    );

                    if (parsed === null || totalNumber === null || totalNumber <= 0) {
                      return "Porcentaje no disponible todavía";
                    }

                    return `${Math.round((parsed / totalNumber) * 1000) / 10} % del alquiler total`;
                  })()}
                </p>
              </div>

              <div className="relative w-full sm:w-40">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
                  €
                </span>

                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000}
                  value={contributionInputs[contribution.member_id] ?? ""}
                  onChange={(event) => {
                    setContributionInputs((current) => ({
                      ...current,
                      [contribution.member_id]: event.target.value,
                    }));
                    setSaveSuccess(false);
                  }}
                  placeholder="Ej. 500"
                  className="h-11 w-full rounded-14 border border-line bg-surface pl-9 pr-4 text-base text-foreground outline-none transition focus:border-brand"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-18 bg-surface-soft p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Alquiler total</span>
            <span className="font-bold text-foreground">
              {totalNumber !== null ? formatEuros(totalNumber) : "Sin definir"}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-muted">Aportaciones configuradas</span>
            <span className="font-bold text-foreground">
              {formatEuros(totalConfigured)}
            </span>
          </div>

          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-muted">
              {remaining !== null && remaining < 0
                ? "Superan el alquiler total en"
                : "Faltan por repartir"}
            </span>
            <span
              className={`font-bold ${
                remaining === null
                  ? "text-foreground"
                  : remaining < 0
                    ? "text-red-600"
                    : remaining === 0
                      ? "text-brand-dark"
                      : "text-foreground"
              }`}
            >
              {remaining !== null
                ? formatEuros(Math.abs(remaining))
                : "—"}
            </span>
          </div>

          {mismatch && (
            <p className="mt-3 rounded-14 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
              Las aportaciones no coinciden con el alquiler total. Revisa
              el reparto antes de guardarlo como definitivo.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center rounded-14 bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {saveError && (
          <p className="text-sm font-semibold text-red-600">{saveError}</p>
        )}

        {saveSuccess && !saveError && (
          <p className="text-sm font-semibold text-brand-dark">
            Reparto del alquiler actualizado correctamente.
          </p>
        )}
      </form>
    </div>
  );
}
