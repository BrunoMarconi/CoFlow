"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import Spinner from "@/components/ui/Spinner";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserConnection } from "@/hooks/useUserConnection";
import { cn } from "@/lib/utils";

const TAG_KEYS = [
  "cleanliness",
  "dishes",
  "common_objects",
  "noise",
  "visits",
  "sleepovers",
  "wake_up",
  "night_noise",
  "smoking",
  "alcohol",
  "pets",
  "bills",
  "food",
  "communication",
  "conflicts",
  "rules",
  "culture",
  "space",
  "lifestyle",
] as const;

const TAG_LABELS: Record<(typeof TAG_KEYS)[number], string> = {
  cleanliness: "Limpieza",
  dishes: "Platos",
  common_objects: "Zonas comunes",
  noise: "Ambiente",
  visits: "Visitas",
  sleepovers: "Pernoctaciones",
  wake_up: "Rutina",
  night_noise: "Ruido nocturno",
  smoking: "Tabaco",
  alcohol: "Alcohol",
  pets: "Mascotas",
  bills: "Facturas",
  food: "Comida",
  communication: "Comunicación",
  conflicts: "Conflictos",
  rules: "Reglas",
  culture: "Cultura",
  space: "Espacio personal",
  lifestyle: "Convivencia",
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

  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    // overflow:hidden en body no basta en iOS Safari (el scroll de fondo
    // sigue rebotando) — fijamos el body en su posición actual con
    // position:fixed, y la restauramos al cerrar, para bloquear de
    // verdad el scroll de la página de detrás mientras el modal esté
    // abierto.
    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.position = previousStyle.position;
      body.style.top = previousStyle.top;
      body.style.left = previousStyle.left;
      body.style.right = previousStyle.right;
      body.style.width = previousStyle.width;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  function expandToFullScreen() {
    if (!expanded) setExpanded(true);
  }

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "";

  const metaLine = profile
    ? [
        profile.age !== null ? `${profile.age} años` : null,
        profile.community?.city ?? null,
      ]
        .filter(Boolean)
        .join(" · ")
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

  const overlayTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: 0.2, ease: "easeOut" as const };

  const sheetTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.9 };

  const sheetInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { y: 40, opacity: 0, scale: 0.98 };

  const sheetAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { y: 0, opacity: 1, scale: 1 };

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={overlayTransition}
        className="absolute inset-0 bg-black/40"
      />

      <motion.div
        initial={sheetInitial}
        animate={sheetAnimate}
        exit={sheetInitial}
        transition={sheetTransition}
        style={{ willChange: "transform" }}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-surface shadow-2xl sm:max-w-lg sm:rounded-24",
          expanded
            ? "h-dvh rounded-t-none sm:h-[85dvh]"
            : "max-h-[85dvh] rounded-t-24"
        )}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-border" />
        </div>

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
          <div
            ref={contentRef}
            onWheel={expandToFullScreen}
            onTouchMove={expandToFullScreen}
            className={cn(
              "flex flex-1 flex-col",
              expanded ? "overflow-y-auto overscroll-contain" : "overflow-hidden"
            )}
          >
            <div className="p-5 pt-8 sm:p-6 sm:pt-8">
              <div className="flex items-start gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-18 bg-mint-100 sm:h-28 sm:w-28">
                  {coverPhoto || profile.avatar_url ? (
                    <Image
                      src={coverPhoto ?? profile.avatar_url!}
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

                  {profile.is_online && (
                    <span
                      title="En línea"
                      className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-500"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
                    {fullName || "Persona de CoFlow"}
                  </h2>

                  {metaLine && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-secondary">
                      {metaLine}
                      <LocationIcon />
                    </p>
                  )}

                  {profile.occupation && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-secondary">
                      <BriefcaseIcon />
                      {profile.occupation}
                    </p>
                  )}
                </div>
              </div>

              {profile.is_verified && (
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1.5 text-xs font-bold text-primary-dark">
                  <VerifiedIcon className="h-3.5 w-3.5" />
                  Perfil verificado
                </span>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
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

              {profile.bio && (
                <p className="mt-4 text-sm leading-6 text-secondary">
                  {profile.bio}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-18 border border-border bg-surface-muted px-4 py-3">
                  <p className="text-xs font-semibold text-muted">
                    Presupuesto
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">
                    {budgetLabel}
                  </p>
                </div>

                <div className="rounded-18 border border-border bg-surface-muted px-4 py-3">
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
                    Estilo de vida y convivencia
                  </p>

                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.key}
                        className="rounded-14 bg-surface-soft px-3 py-2"
                      >
                        <p className="text-[11px] font-semibold text-muted">
                          {tag.label}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          {tag.value}
                        </p>
                      </div>
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
                    {profile.photos.slice(1).map((photo) => (
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
          </div>
        )}
      </motion.div>
    </div>
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

function BriefcaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
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
