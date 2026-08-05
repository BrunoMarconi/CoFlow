"use client";

import { useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import UserAvatar from "@/components/ui/UserAvatar";
import { saveUserProfile, unsaveUserProfile } from "@/services/users";
import type { UserPublicProfile } from "@/types/userPublic";

const CONNECTION_LABELS: Record<string, string> = {
  PENDING_SENT: "Solicitud enviada",
  PENDING_RECEIVED: "Quiere conectar",
  ACCEPTED: "Conectados",
};

export default function UserCard({ user }: { user: UserPublicProfile }) {
  const [saved, setSaved] = useState(user.is_saved);
  const [saving, setSaving] = useState(false);

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  const budgetLabel =
    user.rental_budget !== null
      ? `Hasta ${user.rental_budget.toLocaleString("es-ES")} €/mes`
      : "Presupuesto no indicado";

  const traits = [
    user.preferences?.noise,
    user.preferences?.cleanliness,
    user.preferences?.smoking,
  ].filter((trait): trait is string => Boolean(trait));

  const connectionLabel = CONNECTION_LABELS[user.connection_status];

  async function handleToggleSave(event: React.MouseEvent) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);

    try {
      if (saved) {
        await unsaveUserProfile(user.id);
        setSaved(false);
      } else {
        await saveUserProfile(user.id);
        setSaved(true);
      }
    } catch {
      // El usuario puede reintentar si falla.
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="flex h-full flex-col rounded-18 border border-border bg-surface p-4 shadow-soft transition-all duration-180 ease-out sm:hover:-translate-y-0.5 sm:hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)] sm:p-5">
      <Link
        href={`/personas/${user.id}`}
        className="flex items-start gap-3 active:scale-[0.99]"
      >
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          userId={user.id}
          size="lg"
        />

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-lg font-bold text-foreground">
              {fullName || "Persona de CoFlow"}
            </h3>

            {user.is_owner && (
              <StatusBadge variant="info" className="shrink-0">
                Propietario
              </StatusBadge>
            )}
          </div>

          {user.community && (
            <p className="truncate text-sm font-medium text-secondary">
              {user.community.city}
            </p>
          )}

          {connectionLabel && (
            <span className="mt-1 inline-flex items-center rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
              {connectionLabel}
            </span>
          )}
        </div>
      </Link>

      <span className="mt-3 inline-flex w-fit items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-brand-dark">
        {budgetLabel}
      </span>

      {traits.length > 0 && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
          {traits.join(" · ")}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link
          href={`/personas/${user.id}`}
          className="flex h-11 flex-1 items-center justify-center rounded-14 bg-brand-dark text-sm font-bold text-white transition-colors duration-180 hover:bg-brand-dark/90"
        >
          Ver perfil
        </Link>

        <button
          type="button"
          onClick={handleToggleSave}
          disabled={saving}
          aria-label={saved ? "Quitar de guardados" : "Guardar perfil"}
          aria-pressed={saved}
          title={saved ? "Quitar de guardados" : "Guardar perfil"}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-14 border transition-colors duration-180 disabled:cursor-not-allowed disabled:opacity-60 ${
            saved
              ? "border-primary bg-mint-100 text-brand-dark"
              : "border-border bg-surface text-muted hover:border-primary/40"
          }`}
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>
    </article>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 3h12v18l-6-4-6 4Z" />
    </svg>
  );
}
