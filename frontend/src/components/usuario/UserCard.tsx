"use client";

import { useState } from "react";
import Link from "next/link";
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

  const cityLabel = user.community
    ? user.community.city
    : user.is_owner
      ? "Propietario"
      : "Buscando comunidad";

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
    <article className="relative flex h-full flex-col overflow-hidden rounded-18 border border-border bg-surface shadow-soft transition-all duration-180 ease-out sm:hover:-translate-y-0.5 sm:hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)]">
      <Link
        href={`/personas/${user.id}`}
        className="flex items-center justify-center bg-mint-50 py-8 active:scale-[0.99]"
      >
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          userId={user.id}
          imageUrl={user.avatar_url}
          size="xl"
        />
      </Link>

      <button
        type="button"
        onClick={handleToggleSave}
        disabled={saving}
        aria-label={saved ? "Quitar de guardados" : "Guardar perfil"}
        aria-pressed={saved}
        title={saved ? "Quitar de guardados" : "Guardar perfil"}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-180 disabled:cursor-not-allowed disabled:opacity-60 ${
          saved
            ? "border-primary bg-mint-100 text-brand-dark"
            : "border-border bg-surface text-muted hover:border-primary/40"
        }`}
      >
        <BookmarkIcon filled={saved} />
      </button>

      <div className="flex flex-1 flex-col p-4 text-center sm:p-5">
        <h3 className="truncate text-lg font-bold text-foreground">
          {fullName || "Persona de CoFlow"}
        </h3>

        <p className="truncate text-sm font-medium text-secondary">
          {cityLabel}
        </p>

        {connectionLabel && (
          <span className="mx-auto mt-2 inline-flex items-center rounded-full bg-mint-100 px-2 py-0.5 text-[11px] font-bold text-brand-dark">
            {connectionLabel}
          </span>
        )}

        <span className="mx-auto mt-3 inline-flex w-fit items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-brand-dark">
          {budgetLabel}
        </span>

        {traits.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {traits.slice(0, 3).map((trait) => (
              <span
                key={trait}
                className="inline-flex items-center rounded-full bg-mint-50 px-2.5 py-1 text-[11px] font-bold text-primary-dark"
              >
                {trait}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/personas/${user.id}`}
          className="-mx-4 mt-auto flex items-center justify-center gap-2 border-t border-border pt-3 text-sm font-bold text-brand-dark transition-colors duration-180 hover:text-primary sm:-mx-5"
        >
          Ver perfil
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
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
