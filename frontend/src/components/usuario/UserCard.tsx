"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import { useUserConnection } from "@/hooks/useUserConnection";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { detailTransitionName } from "@/lib/detailTransitions";
import type { UserPublicProfile } from "@/types/userPublic";

const CONNECTION_LABELS: Record<string, string> = {
  PENDING_SENT: "Solicitud enviada",
  PENDING_RECEIVED: "Quiere conectar",
  ACCEPTED: "Conectados",
};

export default function UserCard({
  user,
  onOpen,
  mobileVariant = "compact",
}: {
  user: UserPublicProfile;
  onOpen: (userId: string) => void;
  mobileVariant?: "featured" | "compact";
}) {
  const router = useRouter();
  const {
    saved,
    savingToggle,
    toggleSave,
    connectionStatus,
    connectionId,
    connecting,
    connect,
  } = useUserConnection(user);

  const fullName = `${user.first_name} ${user.last_name}`.trim();
  const shortName = `${user.first_name}${user.age !== null ? `, ${user.age}` : ""}`;
  const budgetLabel =
    user.rental_budget !== null
      ? `${user.rental_budget.toLocaleString("es-ES")} € / mes`
      : "Sin definir";
  const traits = [
    user.occupation,
    user.preferences?.lifestyle,
    user.preferences?.cleanliness,
  ].filter((trait): trait is string => Boolean(trait));
  const statusLabel = CONNECTION_LABELS[connectionStatus];
  const locationLabel = user.community?.city || (user.is_owner ? "Propietario" : "Busca comunidad");
  const profilePhoto =
    [...user.photos].sort((a, b) => a.position - b.position)[0]?.image_url ||
    user.avatar_url;
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const hasProfilePhoto = Boolean(profilePhoto) && !profilePhotoFailed;

  function handleOpen() {
    onOpen(user.id);
  }

  async function handleSave(event: React.MouseEvent) {
    event.stopPropagation();
    await toggleSave();
  }

  async function handlePrimaryAction(event: React.MouseEvent) {
    event.stopPropagation();
    if (connectionStatus === "NONE") {
      await connect();
      return;
    }

    if (connectionStatus === "ACCEPTED" && connectionId) {
      router.push(`/mensajes/${connectionId}`);
      return;
    }

    if (connectionStatus === "PENDING_RECEIVED") {
      router.push("/conexiones?tab=recibidas");
      return;
    }

    handleOpen();
  }

  return (
    <motion.article
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") handleOpen();
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className="cursor-pointer outline-none"
    >
      <ViewTransition name={detailTransitionName("person", user.id)} share="coflow-detail-morph">
        <div className="h-full">{renderCardContent()}</div>
      </ViewTransition>
    </motion.article>
  );

  function renderCardContent() {
    return <>
      <div className="sm:hidden">
        {mobileVariant === "featured" ? (
          <div className="h-full overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
            <div className="relative h-36 bg-surface-muted min-[390px]:h-44">
              {hasProfilePhoto && profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt={fullName}
                  fill
                  unoptimized
                  sizes="50vw"
                  className="object-cover"
                  onError={() => setProfilePhotoFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-surface">
                  <UserAvatar
                    firstName={user.first_name}
                    lastName={user.last_name}
                    userId={user.id}
                    size="xl"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={savingToggle}
                aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
                aria-pressed={saved}
                className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-primary shadow-soft disabled:opacity-60"
              >
                <HeartIcon filled={saved} />
              </button>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-[15px] font-extrabold text-foreground">
                  {shortName}
                </h3>
                {user.is_verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-primary" />}
              </div>

              <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-secondary">
                <LocationIcon />
                {locationLabel}
              </p>

              {!user.community && (
                <span className="mt-2 inline-flex max-w-full truncate rounded-full border border-border bg-surface px-2 py-1 text-[10px] font-bold text-primary-dark shadow-soft">
                  Busca comunidad
                </span>
              )}

              <p className="mt-2 truncate text-[11px] text-secondary">
                Presupuesto: <span className="font-extrabold text-brand-dark">{budgetLabel}</span>
              </p>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpen();
                }}
                className="mt-3 flex h-9 w-full items-center justify-center rounded-10 bg-primary px-2 text-xs font-bold text-white shadow-button"
              >
                Ver perfil
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-24 items-center gap-3 rounded-18 border border-border bg-surface p-3 shadow-soft">
            <div className="relative shrink-0">
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                userId={user.id}
                imageUrl={user.avatar_url}
                size="lg"
              />
              {user.is_online && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-sm font-extrabold text-foreground">{shortName}</h3>
                {user.is_verified && <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-secondary">
                <LocationIcon />
                {locationLabel}
              </p>
              <p className="mt-1 truncate text-[11px] text-secondary">
                Presupuesto: <span className="font-bold text-primary-dark">{budgetLabel}</span>
              </p>
            </div>

            {traits.length > 0 && (
              <div className="hidden max-w-[42%] flex-wrap gap-1 min-[380px]:flex">
                {traits.slice(0, 3).map((trait) => (
                  <span
                    key={trait}
                    className="max-w-full truncate rounded-full border border-border bg-surface px-2 py-1 text-[9px] font-bold text-primary-dark shadow-soft"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}

            <ChevronIcon />
          </div>
        )}
      </div>

      <div className="hidden h-full flex-col overflow-hidden rounded-18 border border-border bg-surface shadow-soft transition-shadow duration-200 sm:flex sm:hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)]">
        <div className="relative h-40 shrink-0 border-b border-border bg-surface lg:h-44">
          {hasProfilePhoto && profilePhoto ? (
            <Image
              src={profilePhoto}
              alt={fullName}
              fill
              unoptimized
              sizes="(min-width:1280px) 33vw, 50vw"
              className="object-cover"
              onError={() => setProfilePhotoFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                userId={user.id}
                imageUrl={null}
                size="xl"
                className="border-4 border-white shadow-soft"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={savingToggle}
            aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-pressed={saved}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-primary shadow-soft disabled:opacity-60"
          >
            <HeartIcon filled={saved} />
          </button>
        </div>

        <div className="flex min-h-52 flex-1 flex-col p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-base font-extrabold text-foreground">
                  {fullName || "Persona de CoFlow"}
                  {user.age !== null && <span className="font-semibold text-secondary">, {user.age}</span>}
                </h3>
                {user.is_verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-primary" />}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-secondary">
                <LocationIcon />
                {locationLabel}
              </p>
            </div>
            {statusLabel && (
              <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-1 text-[10px] font-bold text-primary-dark shadow-soft">
                {statusLabel}
              </span>
            )}
          </div>

          {user.bio && <p className="mt-3 line-clamp-2 text-sm leading-5 text-secondary">{user.bio}</p>}

          {traits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {traits.slice(0, 3).map((trait) => (
                <span key={trait} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-bold text-primary-dark shadow-soft">
                  {trait}
                </span>
              ))}
            </div>
          )}

          <p className="pt-4 text-xs text-secondary">
            Presupuesto <span className="font-extrabold text-brand-dark">{budgetLabel}</span>
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={connecting || connectionStatus === "PENDING_SENT"}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-14 bg-primary px-4 text-sm font-bold text-white shadow-button disabled:opacity-60"
            >
              <MessageIcon />
              {connectionStatus === "ACCEPTED"
                ? "Enviar mensaje"
                : connectionStatus === "PENDING_SENT"
                  ? "Solicitud enviada"
                  : connectionStatus === "PENDING_RECEIVED"
                    ? "Responder solicitud"
                    : connecting
                      ? "Enviando..."
                      : "Conectar"}
            </button>

          </div>
        </div>
      </div>
    </>;
  }
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l2 3-2 3 3.5 1.5L6 20l3.5-.5L12 22l2.5-2.5L18 20l.5-3.5L22 15l-2-3 2-3-3.5-1.5L18 4l-3.5.5Z" />
      <path d="m8.5 12.3 2.2 2.2 4.3-4.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <motion.svg
      animate={{ scale: filled ? [1, 1.15, 1] : 1 }}
      transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
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
    </motion.svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
