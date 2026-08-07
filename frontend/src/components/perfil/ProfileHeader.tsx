import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import type { User } from "@/types/auth";

export default function ProfileHeader({
  user,
  isOwner = false,
  onAvatarUpdated,
}: {
  user: User;
  isOwner?: boolean;
  onAvatarUpdated: () => Promise<void>;
}) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const missingAvatar = !user.avatar_url;
  const missingOtherFields = !user.phone || user.rental_budget === null;

  return (
    <header className="relative overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
      <div className="h-28 bg-gradient-to-br from-mint-100 via-mint-50 to-surface sm:h-36" />

      <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
        <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="relative rounded-full border-4 border-surface bg-surface shadow-soft">
              <Avatar name={fullName} imageUrl={user.avatar_url} size={88} />
              <AvatarUploader
                hasAvatar={Boolean(user.avatar_url)}
                onUpdated={onAvatarUpdated}
              />
            </div>

            <div className="pb-1">
              <h1 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-muted">
                Perfil de CoFlow
              </p>
            </div>
          </div>

          <Link
            href="/perfil/editar"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-14 border border-border bg-surface px-5 text-sm font-bold text-brand-dark shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-mint-50"
          >
            <EditIcon />
            Editar perfil
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 px-3 py-2 text-xs font-bold text-primary-dark">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Perfil activo
          </span>

          {user.onboarding_completed && (
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-xs font-bold text-secondary">
              <CheckIcon />
              Preferencias completadas
            </span>
          )}

          {isOwner && (
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-3 py-2 text-xs font-bold text-white shadow-soft">
              <KeyIcon />
              Propietario
            </span>
          )}

          {missingAvatar ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-mint-100 px-3 py-2 text-xs font-bold text-primary-dark">
              <CameraSmallIcon />
              Añade tu foto — genera más confianza
            </span>
          ) : (
            missingOtherFields && (
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-xs font-bold text-secondary">
                <InfoSmallIcon />
                Perfil incompleto
              </span>
            )
          )}
        </div>
      </div>
    </header>
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

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.5-8.5" />
      <path d="m16.5 6 2.5 2.5" />
      <path d="m14 8.5 2.5 2.5" />
    </svg>
  );
}

function CameraSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function InfoSmallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v4h1" />
    </svg>
  );
}

function CheckIcon() {
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
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}