"use client";

import { useState } from "react";
import { updateProfile } from "@/services/users";
import type { User } from "@/types/auth";

export default function RoommateSearchCard({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleToggle() {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await updateProfile({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        rental_budget: user.rental_budget,
        is_looking_for_roommates: !user.is_looking_for_roommates,
      });
      await onUpdated();
    } catch {
      setError("No pudimos guardar el cambio. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-18 border border-border/60 bg-surface p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
        Búsqueda de compañeros
      </p>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-dark">
            {user.is_looking_for_roommates
              ? "Estás buscando compañeros de piso"
              : "No estás buscando compañeros ahora mismo"}
          </p>

          <p className="mt-2 text-sm leading-6 text-muted">
            Si lo desactivas, dejarás de aparecer en el descubrimiento de
            personas.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={user.is_looking_for_roommates}
          aria-label="Estoy buscando compañeros de piso"
          disabled={saving}
          onClick={handleToggle}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
            user.is_looking_for_roommates ? "bg-primary" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-surface shadow-soft transition ${
              user.is_looking_for_roommates
                ? "translate-x-7"
                : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      )}
    </section>
  );
}
