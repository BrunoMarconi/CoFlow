"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import Spinner from "@/components/ui/Spinner";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { useUserConnection } from "@/hooks/useUserConnection";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type { PublicUserPreferences, UserPublicProfile } from "@/types/userPublic";
import CompatibilityExplanation from "@/components/usuario/CompatibilityExplanation";

const PREVIEW_PREFERENCES: Array<{
  key: keyof PublicUserPreferences;
  label: string;
}> = [
  { key: "lifestyle", label: "Convivencia" },
  { key: "cleanliness", label: "Limpieza" },
  { key: "smoking", label: "Tabaco" },
  { key: "visits", label: "Visitas" },
  { key: "pets", label: "Mascotas" },
];

const subscribeToClient = () => () => {};

export default function PersonPreviewPanel({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );
  const { profile, loading, notFound } = usePublicProfile(userId);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previous.overflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-5">
      <motion.button
        type="button"
        aria-label="Cerrar vista previa"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del perfil"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-24 border border-border bg-surface shadow-2xl sm:max-w-lg sm:rounded-24"
      >
        <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-soft"
        >
          <CloseIcon />
        </button>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center"><Spinner /></div>
        ) : notFound || !profile ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <p className="text-base font-extrabold text-foreground">No encontramos este perfil</p>
            <p className="mt-1 text-sm text-secondary">Puede que ya no esté disponible.</p>
          </div>
        ) : (
          <PreviewContent profile={profile} onClose={onClose} />
        )}
      </motion.section>
    </div>,
    document.body
  );
}

function PreviewContent({ profile, onClose }: { profile: UserPublicProfile; onClose: () => void }) {
  const {
    saved,
    savingToggle,
    toggleSave,
    connectionStatus,
    connectionId,
    connecting,
    connectionError,
    connect,
  } = useUserConnection(profile);

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const mainPhoto = [...profile.photos].sort((a, b) => a.position - b.position)[0]?.image_url ?? profile.avatar_url;
  const budget = profile.rental_budget !== null
    ? `${profile.rental_budget.toLocaleString("es-ES")} € / mes`
    : "Sin definir";
  const traits = profile.preferences
    ? PREVIEW_PREFERENCES.map((item) => ({ ...item, value: profile.preferences![item.key] }))
        .filter((item) => Boolean(item.value))
        .slice(0, 5)
    : [];

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative h-40 bg-surface sm:h-48">
          {mainPhoto ? (
            <Image src={mainPhoto} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-surface">
              <UserAvatar firstName={profile.first_name} lastName={profile.last_name} userId={profile.id} size="xl" />
            </div>
          )}
        </div>

        <div className="relative px-5 pb-5 pt-14">
          <div className="absolute -top-12 left-5 rounded-full border-4 border-white bg-surface shadow-soft">
            <UserAvatar
              firstName={profile.first_name}
              lastName={profile.last_name}
              userId={profile.id}
              imageUrl={profile.avatar_url}
              size="xl"
            />
            {profile.is_online && <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />}
          </div>

          <button
            type="button"
            onClick={toggleSave}
            disabled={savingToggle}
            aria-label={saved ? "Quitar de guardados" : "Guardar perfil"}
            className="absolute right-5 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-primary shadow-soft disabled:opacity-60"
          >
            <HeartIcon filled={saved} />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="truncate font-rounded text-2xl font-semibold text-brand-dark">{fullName || "Persona de CoFlow"}</h2>
            {profile.is_verified && <VerifiedIcon />}
          </div>

          <p className="mt-1 text-sm text-secondary">
            {[profile.age !== null ? `${profile.age} años` : null, profile.community?.city ?? null].filter(Boolean).join(" · ") || "Información personal no indicada"}
          </p>

          <p className="mt-2 text-sm font-bold text-primary-dark">
            {profile.is_looking_for_roommates ? "Buscando compañero de piso" : "No busca compañero actualmente"}
          </p>

          {profile.bio && <p className="mt-4 line-clamp-4 text-sm leading-6 text-secondary">{profile.bio}</p>}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <PreviewFact label="Presupuesto" value={budget} />
            <PreviewFact label="Comunidad" value={profile.community?.name ?? "Sin comunidad"} />
          </div>

          {profile.match_score !== null && profile.match_breakdown && (
            <div className="mt-4">
              <CompatibilityExplanation
                score={profile.match_score}
                breakdown={profile.match_breakdown}
                compact
              />
            </div>
          )}

          {traits.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-extrabold text-foreground">Estilo de convivencia</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {traits.map((trait) => (
                  <span key={trait.key} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-primary-dark shadow-soft">
                    {trait.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {connectionError && <p className="mt-4 text-sm font-semibold text-red-600">{connectionError}</p>}

          <Link
            href={`/personas/${profile.id}`}
            onClick={onClose}
            className="mt-5 flex h-11 items-center justify-center gap-2 rounded-14 border border-primary bg-surface text-sm font-bold text-primary-dark shadow-soft"
          >
            Ver perfil completo
            <ArrowRightIcon />
          </Link>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-border bg-surface p-4">
        <button
          type="button"
          onClick={toggleSave}
          disabled={savingToggle}
          className="flex h-12 items-center justify-center gap-2 rounded-14 border border-primary bg-surface text-sm font-bold text-primary-dark shadow-soft disabled:opacity-60"
        >
          <HeartIcon filled={saved} />
          {saved ? "Guardado" : "Guardar"}
        </button>

        <PreviewConnectionAction
          profile={profile}
          status={connectionStatus}
          connectionId={connectionId}
          connecting={connecting}
          onConnect={connect}
        />
      </div>
    </>
  );
}

function PreviewConnectionAction({ profile, status, connectionId, connecting, onConnect }: { profile: UserPublicProfile; status: UserPublicProfile["connection_status"]; connectionId: number | null; connecting: boolean; onConnect: () => void }) {
  const activeClass = "flex h-12 items-center justify-center rounded-14 bg-primary px-3 text-sm font-bold text-white shadow-button";
  if (status === "ACCEPTED" && connectionId !== null) return <Link href={`/mensajes/${connectionId}`} className={activeClass}>Enviar mensaje</Link>;
  if (status === "PENDING_RECEIVED") return <Link href="/conexiones?tab=recibidas" className={activeClass}>Responder</Link>;
  if (status === "PENDING_SENT") return <span className="flex h-12 items-center justify-center rounded-14 border border-border bg-surface text-xs font-bold text-secondary shadow-soft">Solicitud enviada</span>;
  return <button type="button" onClick={onConnect} disabled={connecting || !profile.is_looking_for_roommates} className={`${activeClass} disabled:opacity-45`}>{connecting ? "Enviando..." : "Conectar"}</button>;
}

function PreviewFact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-14 border border-border bg-surface p-3 shadow-soft"><p className="text-[11px] text-secondary">{label}</p><p className="mt-0.5 truncate text-xs font-extrabold text-foreground">{value}</p></div>;
}

function CloseIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>; }
function ArrowRightIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function VerifiedIcon() { return <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white" role="img" aria-label="Correo confirmado" title="Correo confirmado"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg></span>; }
function HeartIcon({ filled }: { filled: boolean }) { return <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" /></svg>; }
