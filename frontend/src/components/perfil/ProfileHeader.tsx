"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import type { User } from "@/types/auth";

export default function ProfileHeader({
  user,
  isOwner = false,
  cityLabel,
  onAvatarUpdated,
  onShare,
  shared,
}: {
  user: User;
  isOwner?: boolean;
  cityLabel?: string | null;
  onAvatarUpdated: () => Promise<void>;
  onShare: () => void;
  shared: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const fullName = `${user.first_name} ${user.last_name}`.trim();

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const metaLine = [
    user.age !== null ? `${user.age} años` : null,
    cityLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  const budgetLabel =
    user.rental_budget !== null
      ? `${user.rental_budget.toLocaleString("es-ES")} €/mes`
      : null;

  return (
    <section className="rounded-18 border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-18 bg-mint-100 sm:h-32 sm:w-32">
          {user.avatar_url && !imageError ? (
            <Image
              src={user.avatar_url}
              alt={fullName}
              fill
              unoptimized
              onError={() => setImageError(true)}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary-dark">
              {initials || "?"}
            </div>
          )}

          <AvatarUploader
            hasAvatar={Boolean(user.avatar_url)}
            onUpdated={onAvatarUpdated}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
              {fullName}
            </h1>

            {user.is_email_verified && (
              <VerifiedIcon className="h-5 w-5 shrink-0 text-primary" />
            )}

            {isOwner && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-dark px-2.5 py-1 text-[11px] font-bold text-white">
                Propietario
              </span>
            )}
          </div>

          {metaLine && (
            <p className="mt-1 text-sm font-semibold text-secondary">
              {metaLine}
            </p>
          )}

          {(budgetLabel || user.occupation) && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {budgetLabel && (
                <div className="flex items-center gap-2">
                  <WalletIcon className="h-4 w-4 shrink-0 text-muted" />
                  <div>
                    <p className="text-[11px] font-semibold text-muted">
                      Presupuesto
                    </p>
                    <p className="text-sm font-bold text-brand-dark">
                      {budgetLabel}
                    </p>
                  </div>
                </div>
              )}

              {user.occupation && (
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4 shrink-0 text-muted" />
                  <div>
                    <p className="text-[11px] font-semibold text-muted">
                      Ocupación
                    </p>
                    <p className="text-sm font-bold text-brand-dark">
                      {user.occupation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/perfil/editar"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-14 bg-brand px-5 text-sm font-bold text-white shadow-button transition hover:bg-brand-dark"
            >
              <EditIcon />
              Editar perfil
            </Link>

            <button
              type="button"
              onClick={onShare}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-14 border border-border bg-surface px-5 text-sm font-bold text-brand-dark transition hover:border-primary/30 hover:bg-mint-50"
            >
              <ShareIcon />
              {shared ? "¡Enlace copiado!" : "Compartir perfil"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 3v13" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M17 15h.01" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l2 3-2 3 3.5 1.5L6 20l3.5-.5L12 22l2.5-2.5L18 20l.5-3.5L22 15l-2-3 2-3-3.5-1.5L18 4l-3.5.5Z" />
      <path
        d="m8.5 12.3 2.2 2.2 4.3-4.8"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
