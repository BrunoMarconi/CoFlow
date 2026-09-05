"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import MatchScoreBadge from "./MatchScoreBadge";
import { useUserConnection } from "@/hooks/useUserConnection";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
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
  const habitChips = getHabitChips(user.preferences);
  const statusLabel = CONNECTION_LABELS[connectionStatus];
  const locationLabel = user.community?.city || (user.is_owner ? "Propietario" : "Busca comunidad");
  const metaLine = [user.occupation, locationLabel].filter(Boolean).join(" · ");
  const uploadedPhoto = [...user.photos].sort((a, b) => a.position - b.position)[0]?.image_url;
  // La portada grande solo usa fotos añadidas expresamente a la galería.
  // `avatar_url` puede contener tanto una foto como el avatar genérico de
  // CoFlow y su URL de almacenamiento no permite distinguirlos de forma
  // fiable. El avatar se mantiene para elementos pequeños; sin galería,
  // mostramos la portada de identidad personalizada.
  const profilePhoto = uploadedPhoto;
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
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpen();
        }
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className="cursor-pointer rounded-[22px] outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-3"
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
          <div className="h-full overflow-hidden rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_8px_26px_rgba(20,42,32,.055)]">
            <div className="relative h-40 bg-[#e9ece8] min-[390px]:h-48">
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
                <ProfileIdentityCover user={user} habitChips={habitChips} compact />
              )}

              {user.match_score !== null && (
                <MatchScoreBadge score={user.match_score} size="sm" className="absolute left-2.5 top-2.5" />
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={savingToggle}
                aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
                aria-pressed={saved}
                className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-primary shadow-[0_1px_3px_rgb(0_0_0/0.15)] disabled:opacity-60"
              >
                <HeartIcon filled={saved} />
              </button>
            </div>

            <div className="p-3.5">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[#17251f]">
                  {shortName}
                </h3>
                {user.is_verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-primary" />}
              </div>

              {metaLine && (
                <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-secondary">
                  <LocationIcon />
                  {metaLine}
                </p>
              )}

              <p className="mt-3 truncate border-t border-black/[0.06] pt-3 text-[11px] text-secondary">
                <span className="font-semibold text-[#17392c]">{budgetLabel}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-24 items-center gap-3 rounded-[18px] border border-black/[0.06] bg-[#fbfcfa] p-3 shadow-[0_6px_20px_rgba(20,42,32,.04)]">
            <div className="relative shrink-0">
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                userId={user.id}
                imageUrl={isGenericCoflowAvatar(user.avatar_url) ? null : user.avatar_url}
                size="lg"
              />
              {user.is_online && (
                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-sm font-semibold text-[#17251f]">{shortName}</h3>
                {user.is_verified && <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </div>
              {metaLine && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-secondary">
                  <LocationIcon />
                  {metaLine}
                </p>
              )}
              <p className="mt-1 truncate text-[11px] text-secondary">
                Presupuesto: <span className="font-bold text-primary-dark">{budgetLabel}</span>
              </p>
            </div>

            <div className="hidden shrink-0 flex-col items-end gap-1.5 min-[380px]:flex">
              {user.match_score !== null && <MatchScoreBadge score={user.match_score} size="sm" />}
              {habitChips.length > 0 && (
                <span className="max-w-24 truncate rounded-full bg-flat px-2 py-1 text-[9px] font-bold text-primary-dark">
                  {habitChips[0]}
                </span>
              )}
            </div>

            <ChevronIcon />
          </div>
        )}
      </div>

      <div className="hidden h-full flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] transition-shadow duration-200 sm:flex sm:hover:shadow-[0_20px_42px_-14px_rgb(13_59_42/0.18)]">
        <div className="relative h-52 shrink-0 bg-[#e9ece8] lg:h-56">
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
            <ProfileIdentityCover user={user} habitChips={habitChips} />
          )}

          {user.match_score !== null && (
            <MatchScoreBadge score={user.match_score} className="absolute left-3 top-3" />
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={savingToggle}
            aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-pressed={saved}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_1px_3px_rgb(0_0_0/0.15)] disabled:opacity-60"
          >
            <HeartIcon filled={saved} />
          </button>
        </div>

        <div className="flex min-h-48 flex-1 flex-col p-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-lg font-semibold tracking-[-0.025em] text-[#17251f]">
                  {fullName || "Persona de CoFlow"}
                  {user.age !== null && <span className="font-semibold text-secondary">, {user.age}</span>}
                </h3>
                {user.is_verified && <VerifiedIcon className="h-4 w-4 shrink-0 text-primary" />}
              </div>
              {metaLine && (
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-secondary">
                  <LocationIcon />
                  {metaLine}
                </p>
              )}
            </div>
            {statusLabel && (
              <span className="shrink-0 rounded-full bg-flat px-2 py-1 text-[10px] font-bold text-primary-dark">
                {statusLabel}
              </span>
            )}
          </div>

          {habitChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {habitChips.slice(0, 3).map((chip) => (
                <span key={chip} className="rounded-full bg-[#eaf0ec] px-2.5 py-1.5 text-[10px] font-semibold text-[#315f4b]">
                  {chip}
                </span>
              ))}
            </div>
          )}

          <p className="mt-auto border-t border-black/[0.06] pt-4 text-xs text-secondary">
            Presupuesto <span className="font-semibold text-[#17392c]">{budgetLabel}</span>
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={connecting || connectionStatus === "PENDING_SENT"}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#183c2d] px-4 text-sm font-semibold text-white shadow-none disabled:opacity-60"
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

const IDENTITY_PALETTES = [
  { background: "#dce9e3", ink: "#29473a", accent: "#b7cec2" },
  { background: "#e7e3d8", ink: "#4d493c", accent: "#cec6b2" },
  { background: "#dfe6eb", ink: "#334854", accent: "#bdccd5" },
  { background: "#e8dedc", ink: "#563e3a", accent: "#d3beba" },
] as const;

function ProfileIdentityCover({ user, habitChips, compact = false }: { user: UserPublicProfile; habitChips: string[]; compact?: boolean }) {
  const initials = [user.first_name, user.last_name].filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CF";
  const hash = [...user.id].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 0);
  const palette = IDENTITY_PALETTES[hash % IDENTITY_PALETTES.length];
  const traits = habitChips.length > 0 ? habitChips.slice(0, compact ? 2 : 3) : [user.occupation].filter((value): value is string => Boolean(value));

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 text-center" style={{ backgroundColor: palette.background, color: palette.ink }} aria-label={`Portada de perfil de ${user.first_name}`}>
      <span className="absolute -left-8 -top-10 h-28 w-28 rounded-full border-[18px] opacity-45" style={{ borderColor: palette.accent }} />
      <span className="absolute -bottom-12 -right-8 h-32 w-32 rotate-12 rounded-[32px] opacity-50" style={{ backgroundColor: palette.accent }} />
      <span className="absolute right-[18%] top-[18%] h-2 w-2 rounded-full opacity-50" style={{ backgroundColor: palette.ink }} />
      <div className={`relative flex items-center justify-center rounded-full border border-white/60 bg-white/55 font-bold tracking-[-.05em] shadow-[0_10px_30px_rgba(41,71,58,.1)] backdrop-blur ${compact ? "h-16 w-16 text-2xl" : "h-20 w-20 text-3xl"}`}>{initials}</div>
      <p className={`relative mt-2 font-semibold tracking-[-.025em] ${compact ? "text-xs" : "text-sm"}`}>{user.first_name}{user.age !== null ? `, ${user.age}` : ""}</p>
      {traits.length > 0 && <div className="relative mt-2 flex max-w-full flex-wrap justify-center gap-1">{traits.map((trait) => <span key={trait} className="max-w-full truncate rounded-full border border-white/50 bg-white/45 px-2 py-1 text-[8px] font-semibold backdrop-blur">{trait}</span>)}</div>}
      <span className="absolute bottom-2.5 left-3 text-[8px] font-semibold uppercase tracking-[.13em] opacity-60">Perfil CoFlow</span>
    </div>
  );
}

function isGenericCoflowAvatar(url: string | null): boolean {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes("logo-coflow") || normalized.includes("default-avatar") || normalized.includes("coflow-avatar");
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
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} role="img" aria-label="Correo confirmado">
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
