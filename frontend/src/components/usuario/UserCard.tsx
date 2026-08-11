"use client";

import { motion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import { useUserConnection } from "@/hooks/useUserConnection";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
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
  const {
    saved,
    savingToggle,
    toggleSave,
    connectionStatus,
    connecting,
    connect,
  } = useUserConnection(user);

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  const budgetLabel =
    user.rental_budget !== null
      ? `${user.rental_budget.toLocaleString("es-ES")} €`
      : "Sin definir";

  const traits = [
    user.preferences?.lifestyle,
    user.preferences?.cleanliness,
    user.preferences?.smoking,
  ].filter((trait): trait is string => Boolean(trait));

  const statusLabel = CONNECTION_LABELS[connectionStatus];

  const locationLabel = user.community
    ? user.community.city
    : user.is_owner
      ? "Propietario"
      : "Busca comunidad";

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
    } else {
      handleOpen();
    }
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
      className="flex h-full cursor-pointer flex-col rounded-18 border border-border p-4 transition-shadow duration-200 ease-out sm:p-5 sm:hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)]"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            userId={user.id}
            imageUrl={user.avatar_url}
            size="lg"
          />

          {user.is_online && (
            <span
              aria-label="En línea"
              title="En línea"
              className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-500"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-base font-bold text-foreground">
              <span className="inline">{fullName || "Persona de CoFlow"}</span>
              {user.age !== null && (
                <span className="font-semibold text-secondary">
                  , {user.age}
                </span>
              )}
            </h3>

            {user.is_verified && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
                className="inline-flex shrink-0"
              >
                <VerifiedIcon className="h-4 w-4 text-primary" />
              </motion.span>
            )}
          </div>

          {user.occupation && (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-secondary">
              <BriefcaseIcon />
              <span className="truncate">{user.occupation}</span>
            </div>
          )}

          <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-secondary">
            <LocationIcon />
            <span className="truncate">{locationLabel}</span>
          </div>
        </div>

        {statusLabel && (
          <span className="shrink-0 rounded-full bg-mint-100 px-2.5 py-1 text-[11px] font-bold text-primary-dark">
            {statusLabel}
          </span>
        )}
      </div>

      <div>
        {user.bio && (
          <p className="mt-3 line-clamp-2 text-sm leading-5 text-secondary">
            {user.bio}
          </p>
        )}

        {traits.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {traits.slice(0, 3).map((trait, index) => (
              <motion.span
                key={trait}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: MOTION_DURATION.normal,
                  ease: MOTION_EASE.out,
                  delay: index * 0.03,
                }}
                className="inline-flex items-center rounded-full bg-mint-50 px-2.5 py-1 text-[11px] font-bold text-primary-dark"
              >
                {trait}
              </motion.span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs font-semibold text-muted">
          <WalletIcon />
          Presupuesto
          <span className="font-bold text-brand-dark">{budgetLabel}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <motion.button
            type="button"
            onClick={handlePrimaryAction}
            disabled={connecting || connectionStatus === "PENDING_SENT"}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-14 bg-brand px-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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
          </motion.button>

          <motion.button
            type="button"
            onClick={handleSave}
            disabled={savingToggle}
            aria-label={saved ? "Quitar de favoritos" : "Guardar en favoritos"}
            aria-pressed={saved}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
              saved
                ? "border-primary/30 bg-mint-100 text-primary-dark"
                : "border-border bg-surface text-muted hover:border-primary/40"
            }`}
          >
            <motion.span
              animate={{ scale: saved ? [1, 1.15, 1] : 1 }}
              transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
              className="inline-flex"
            >
              <HeartIcon filled={saved} />
            </motion.span>
          </motion.button>
        </div>
      </div>
    </motion.article>
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

function BriefcaseIcon() {
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
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
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

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M17 15h.01" />
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

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" />
    </svg>
  );
}
