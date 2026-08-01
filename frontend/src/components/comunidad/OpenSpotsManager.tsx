"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateCommunity } from "@/services/communities";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { Community } from "@/types/community";

export default function OpenSpotsManager({
  community,
  onUpdated,
}: {
  community: Community;
  onUpdated: (community: Community) => void;
}) {
  const { refreshCommunity } = useAuth();

  const availableCapacity = Math.max(
    community.max_members - community.member_count,
    0
  );

  const [value, setValue] = useState(String(community.open_spots));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const parsed = Number(value);

    if (
      !Number.isInteger(parsed) ||
      parsed < 0 ||
      parsed > availableCapacity
    ) {
      setError(
        `Introduce un número de plazas entre 0 y ${availableCapacity}.`
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const updated = await updateCommunity(community.id, {
        open_spots: parsed,
      });

      onUpdated(updated);
      await refreshCommunity();
      setSuccess(true);
    } catch (updateError) {
      setError(
        getCommunityErrorMessage(
          updateError,
          "No pudimos actualizar las plazas abiertas."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-3 sm:p-4">
      <ul className="space-y-1 text-sm leading-6 text-muted">
        <li>
          Actualmente sois{" "}
          <span className="font-bold text-foreground">
            {community.member_count} de {community.max_members}
          </span>{" "}
          miembros.
        </li>

        <li>
          {availableCapacity > 0 ? (
            <>
              Podrían entrar hasta{" "}
              <span className="font-bold text-foreground">
                {availableCapacity}
              </span>{" "}
              {availableCapacity === 1
                ? "persona más"
                : "personas más"}
              .
            </>
          ) : (
            "Ya no queda espacio físico disponible en la vivienda."
          )}
        </li>

        <li>
          Ahora mismo estáis buscando{" "}
          <span className="font-bold text-foreground">
            {community.open_spots}
          </span>{" "}
          {community.open_spots === 1 ? "persona" : "personas"}.
        </li>
      </ul>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label
            htmlFor="open-spots-input"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Plazas abiertas ahora mismo (máximo {availableCapacity})
          </label>

          <input
            id="open-spots-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={availableCapacity}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setSuccess(false);
            }}
            className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-base text-foreground outline-none focus:border-brand sm:max-w-[200px]"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Guardando..." : "Actualizar plazas abiertas"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      )}

      {success && !error && (
        <p className="mt-3 text-sm font-semibold text-brand-dark">
          Plazas abiertas actualizadas correctamente.
        </p>
      )}
    </div>
  );
}
