"use client";

import { useState, ViewTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import FadeImage from "@/components/ui/FadeImage";
import UserAvatar from "@/components/ui/UserAvatar";
import OnlineDot from "@/components/ui/OnlineDot";
import MatchScoreBadge from "./MatchScoreBadge";
import { useUserConnection } from "@/hooks/useUserConnection";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import { detailTransitionName } from "@/lib/detailTransitions";
import { getHabitChips } from "@/lib/habitLabels";
import type { UserPublicProfile } from "@/types/userPublic";

const CONNECTION_LABELS: Record<string, string> = {
  PENDING_SENT: "Solicitud enviada",
  PENDING_RECEIVED: "Quiere conectar",
  ACCEPTED: "Conectados",
};

export default function UserCard({
  user,
  onOpen,
}: {
  user: UserPublicProfile;
  onOpen: (userId: string) => void;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
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
  const displayName = fullName || "Persona de CoFlow";
  const budgetLabel = user.rental_budget !== null
    ? `${user.rental_budget.toLocaleString("es-ES")} € / mes`
    : "Sin definir";
  const habitChips = getHabitChips(user.preferences);
  const visibleChips = habitChips.slice(0, 2);
  const hiddenChipCount = Math.max(habitChips.length - visibleChips.length, 0);
  const statusLabel = CONNECTION_LABELS[connectionStatus];
  const locationLabel = user.community?.city || (user.is_owner ? "Propietario" : "Busca comunidad");
  const metaLine = [user.occupation, locationLabel].filter(Boolean).join(" · ");
  const strongestMatches = [...(user.match_breakdown?.categories ?? [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((category) => category.label);
  const uploadedPhoto = [...user.photos].sort((a, b) => a.position - b.position)[0]?.image_url;
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const hasProfilePhoto = Boolean(uploadedPhoto) && !profilePhotoFailed;

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

  const primaryLabel = connectionStatus === "ACCEPTED"
    ? "Enviar mensaje"
    : connectionStatus === "PENDING_SENT"
      ? "Solicitud enviada"
      : connectionStatus === "PENDING_RECEIVED"
        ? "Responder solicitud"
        : connecting
          ? "Enviando..."
          : "Conectar";

  return (
    <motion.article
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      aria-label={`Abrir perfil de ${displayName}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      whileHover={prefersReducedMotion ? undefined : { y: -3 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
      transition={MOTION_SPRING.snappy}
      className="group h-full cursor-pointer rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-3"
    >
      <ViewTransition name={detailTransitionName("person", user.id)} share="coflow-detail-morph">
        <div className="flex h-full flex-col overflow-hidden rounded-card border border-black/[0.065] bg-surface-raised shadow-card transition-[border-color,box-shadow] duration-200 group-hover:border-primary/20 group-hover:shadow-raised">
          <div className="relative h-44 shrink-0 overflow-hidden bg-[#e9ece8] sm:h-48 lg:h-52">
            {hasProfilePhoto && uploadedPhoto ? (
              <FadeImage
                src={uploadedPhoto}
                alt={`Foto de ${displayName}`}
                fill
                unoptimized
                sizes="(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transform-none"
                onError={() => setProfilePhotoFailed(true)}
              />
            ) : (
              <ProfileIdentityCover user={user} />
            )}

            {user.match_score !== null && (
              <MatchScoreBadge score={user.match_score} size="sm" count className="absolute left-3 top-3 border-0 bg-white/95 shadow-soft backdrop-blur" />
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={savingToggle}
              aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
              aria-pressed={saved}
              className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-primary shadow-soft backdrop-blur transition-colors hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
            >
              <HeartIcon filled={saved} />
            </button>
          </div>

          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5">
                  <h3 className="line-clamp-2 text-base font-semibold leading-5 tracking-[-0.02em] text-brand-dark sm:text-lg sm:leading-6">
                    {displayName}
                    {user.age !== null && <span className="font-semibold text-secondary">, {user.age}</span>}
                  </h3>
                  {user.is_verified && <VerifiedIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                </div>

                {metaLine && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-secondary">
                    <LocationIcon />
                    <span className="line-clamp-2">{metaLine}</span>
                  </p>
                )}
              </div>

              {statusLabel && (
                <span className="shrink-0 rounded-full bg-flat px-2 py-1 text-3xs font-bold text-primary-dark">
                  {statusLabel}
                </span>
              )}
            </div>

            {visibleChips.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {visibleChips.map((chip) => (
                  <span key={chip} className="max-w-full truncate rounded-full bg-[#eaf0ec] px-2.5 py-1.5 text-3xs font-semibold text-brand-mid">
                    {chip}
                  </span>
                ))}
                {hiddenChipCount > 0 && (
                  <span className="rounded-full bg-[#f2f4f2] px-2 py-1.5 text-3xs font-bold text-muted">
                    +{hiddenChipCount}
                  </span>
                )}
              </div>
            )}

            {strongestMatches.length > 0 && user.match_score !== null && (
              <p className="mt-3 flex items-center gap-1.5 text-2xs leading-5 text-secondary">
                <SparkleIcon />
                <span className="line-clamp-1">
                  Mejor encaje: <span className="font-semibold text-brand-dark">{strongestMatches.join(" · ")}</span>
                </span>
              </p>
            )}

            <div className="mt-auto pt-4">
              <p className="border-t border-black/[0.06] pt-3 text-xs text-secondary">
                Presupuesto <span className="font-semibold tabular-nums text-brand-dark">{budgetLabel}</span>
              </p>

              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={connecting || connectionStatus === "PENDING_SENT"}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-dark px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-default disabled:bg-[#74867c] disabled:text-white/90"
              >
                <MessageIcon />
                {primaryLabel}
              </button>
            </div>
          </div>
        </div>
      </ViewTransition>
    </motion.article>
  );
}

const IDENTITY_PALETTES = [
  { background: "#dce9e3", ink: "#29473a", accent: "#b7cec2" },
  { background: "#e7e3d8", ink: "#4d493c", accent: "#cec6b2" },
  { background: "#dfe6eb", ink: "#334854", accent: "#bdccd5" },
  { background: "#e8dedc", ink: "#563e3a", accent: "#d3beba" },
] as const;

function ProfileIdentityCover({ user }: { user: UserPublicProfile }) {
  const hash = [...user.id].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  const palette = IDENTITY_PALETTES[hash % IDENTITY_PALETTES.length];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ backgroundColor: palette.background, color: palette.ink }} aria-label={`Avatar de ${user.first_name}`}>
      <span className="absolute -left-10 -top-12 h-32 w-32 rounded-full border-[20px] opacity-40" style={{ borderColor: palette.accent }} />
      <span className="absolute -bottom-16 -right-8 h-40 w-40 rotate-12 rounded-sheet opacity-45" style={{ backgroundColor: palette.accent }} />
      <span className="absolute right-[18%] top-[20%] h-2.5 w-2.5 rounded-full opacity-40" style={{ backgroundColor: palette.ink }} />
      <div className="relative">
        <UserAvatar
          firstName={user.first_name}
          lastName={user.last_name}
          userId={user.id}
          imageUrl={user.avatar_url}
          size="xl"
          className="border-4 border-white/70 shadow-[0_12px_30px_rgba(41,71,58,.14)]"
        />
        {user.is_online && <OnlineDot className="bottom-1 right-1" />}
      </div>
    </div>
  );
}

function LocationIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function VerifiedIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} role="img" aria-label="Correo confirmado"><path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l2 3-2 3 3.5 1.5L6 20l3.5-.5L12 22l2.5-2.5L18 20l.5-3.5L22 15l-2-3 2-3-3.5-1.5L18 4l-3.5.5Z" /><path d="m8.5 12.3 2.2 2.2 4.3-4.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>;
}

function MessageIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></svg>;
}

function SparkleIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true"><path d="M8 1.5 9.4 6.6 14.5 8l-5.1 1.4L8 14.5 6.6 9.4 1.5 8l5.1-1.4L8 1.5Z" /></svg>;
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
