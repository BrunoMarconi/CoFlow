"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import UserAvatar from "@/components/ui/UserAvatar";
import Spinner from "@/components/ui/Spinner";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserConnection } from "@/hooks/useUserConnection";

const TAG_KEYS = [
  "lifestyle",
  "cleanliness",
  "noise",
  "smoking",
  "pets",
  "visits",
] as const;

const TAG_LABELS: Record<(typeof TAG_KEYS)[number], string> = {
  lifestyle: "Convivencia",
  cleanliness: "Limpieza",
  noise: "Ambiente",
  smoking: "Tabaco",
  pets: "Mascotas",
  visits: "Visitas",
};

export default function PersonPreviewPanel({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const { profile, loading, notFound } = usePublicProfile(userId);
  const {
    saved,
    savingToggle,
    toggleSave,
    connectionStatus,
    connectionId,
    connecting,
    connectionError,
    connect,
    removeConnection,
  } = useUserConnection(profile);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "";

  const budgetLabel = profile?.rental_budget
    ? `${profile.rental_budget.toLocaleString("es-ES")} €/mes`
    : "Sin definir";

  const coverPhoto = profile?.photos?.[0]?.image_url ?? null;

  const tags = profile?.preferences
    ? TAG_KEYS.map((key) => ({
        key,
        label: TAG_LABELS[key],
        value: profile.preferences![key],
      })).filter((tag) => Boolean(tag.value))
    : [];

  return (
    <div className="fixed inset-0 z-(--z-modal) flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto bg-surface shadow-2xl animate-fade-in-up sm:rounded-l-24">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft backdrop-blur transition hover:bg-white"
        >
          <CloseIcon />
        </button>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        ) : notFound || !profile ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-bold text-foreground">
              No hemos encontrado este perfil
            </p>
            <p className="text-sm text-muted">
              Puede que ya no esté disponible.
            </p>
          </div>
        ) : (
          <>
            <div className="relative h-56 w-full shrink-0 overflow-hidden bg-mint-100 sm:h-64">
              {coverPhoto ? (
                <Image
                  src={coverPhoto}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserAvatar
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    userId={profile.id}
                    imageUrl={profile.avatar_url}
                    size="xl"
                  />
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <h2 className="text-2xl font-bold text-foreground">
                {fullName || "Persona de CoFlow"}
              </h2>

              {profile.community && (
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-secondary">
                  <LocationIcon />
                  {profile.community.city}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {profile.is_owner && (
                  <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-brand-dark">
                    Propietario
                  </span>
                )}
                <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-brand-dark">
                  {profile.is_looking_for_roommates
                    ? "Busca compañeros de piso"
                    : "No busca compañeros ahora"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-14 bg-surface-soft px-4 py-3">
                  <p className="text-xs font-semibold text-muted">
                    Presupuesto
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {budgetLabel}
                  </p>
                </div>

                <div className="rounded-14 bg-surface-soft px-4 py-3">
                  <p className="text-xs font-semibold text-muted">
                    Comunidad
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                    {profile.community ? profile.community.name : "Ninguna todavía"}
                  </p>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    Estilo de vida
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag.key}
                        className="inline-flex items-center rounded-full bg-mint-50 px-3 py-1.5 text-xs font-bold text-primary-dark"
                        title={tag.label}
                      >
                        {tag.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.photos.length > 1 && (
                <div className="mt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
                    Fotos
                  </p>

                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {profile.photos.slice(1, 7).map((photo) => (
                      <div
                        key={photo.id}
                        className="relative h-20 overflow-hidden rounded-14"
                      >
                        <Image
                          src={photo.image_url}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {connectionError && (
                <p className="mt-4 text-sm font-semibold text-red-600">
                  {connectionError}
                </p>
              )}
            </div>

            <div className="mt-auto flex items-center gap-2 border-t border-border bg-surface p-4 sm:p-5">
              {connectionStatus === "ACCEPTED" && connectionId !== null && (
                <>
                  <Link
                    href={`/mensajes/${connectionId}`}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-14 bg-brand px-5 text-sm font-bold text-white shadow-button transition hover:bg-brand-dark"
                  >
                    <MessageIcon />
                    Enviar mensaje
                  </Link>

                  <button
                    type="button"
                    onClick={removeConnection}
                    disabled={connecting}
                    aria-label="Eliminar conexión"
                    title="Eliminar conexión"
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <CloseIcon />
                  </button>
                </>
              )}

              {connectionStatus === "PENDING_SENT" && (
                <span className="flex h-12 flex-1 items-center justify-center rounded-14 bg-surface-soft text-sm font-bold text-muted">
                  Solicitud enviada
                </span>
              )}

              {connectionStatus === "PENDING_RECEIVED" && (
                <Link
                  href="/conexiones"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-14 bg-brand px-5 text-sm font-bold text-white shadow-button transition hover:bg-brand-dark"
                >
                  Responder solicitud
                </Link>
              )}

              {connectionStatus === "NONE" && (
                <button
                  type="button"
                  onClick={connect}
                  disabled={connecting || !profile.is_looking_for_roommates}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-14 bg-brand px-5 text-sm font-bold text-white shadow-button transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ConnectIcon />
                  {connecting ? "Enviando..." : "Conectar"}
                </button>
              )}

              <button
                type="button"
                onClick={toggleSave}
                disabled={savingToggle}
                aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
                aria-pressed={saved}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors duration-180 disabled:cursor-not-allowed disabled:opacity-60 ${
                  saved
                    ? "border-primary/30 bg-mint-100 text-primary-dark"
                    : "border-border bg-surface text-muted hover:border-primary/40"
                }`}
              >
                <HeartIcon filled={saved} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5 shrink-0"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M14 14.5a4.5 4.5 0 0 1 7.5 3.5" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
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
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" />
    </svg>
  );
}
