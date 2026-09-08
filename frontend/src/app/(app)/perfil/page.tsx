"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useMobilePageTitle } from "@/hooks/useMobilePageTitle";
import Avatar from "@/components/ui/Avatar";
import ProfileChecklistCard from "@/components/perfil/ProfileChecklistCard";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import TrustSection from "@/components/perfil/TrustProfileCard";
import YourProfileSection from "@/components/perfil/YourProfileSection";
import RoommateSearchCard from "@/components/perfil/RoommateSearchCard";
import DangerZoneSection from "@/components/perfil/DangerZoneSection";
import PageSkeleton from "@/components/ui/PageSkeleton";
import CompatibilityRadar, { CompatibilityRadarIcon } from "@/components/convivencia/CompatibilityRadar";
import { getMyOnboarding } from "@/services/onboarding";
import { getMyCompatibilityScore, getSavedProfiles } from "@/services/users";
import { getConnectionOverview } from "@/services/connections";
import { CONNECTION_OVERVIEW_QUERY_KEY } from "@/lib/connectionQueryState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { getProfileCompletionChecklist } from "@/lib/profileCompletion";
import type { OnboardingAnswers } from "@/types/onboarding";

export default function PerfilPage() {
  const { user, loading, ownerProfile, community, logout, refresh } = useAuth();
  const prefersReducedMotion = useReducedMotion();

  useMobilePageTitle("Mi perfil");

  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [loadingAnswers, setLoadingAnswers] = useState(true);

  const [savedCount, setSavedCount] = useState(0);
  const { data: connectionOverview } = useQuery({
    queryKey: CONNECTION_OVERVIEW_QUERY_KEY,
    queryFn: getConnectionOverview,
    staleTime: 30_000,
  });
  const { data: compatibilityScore } = useQuery({
    queryKey: ["compatibility-score", "me"],
    queryFn: getMyCompatibilityScore,
    enabled: Boolean(user?.onboarding_completed),
    staleTime: 60_000,
  });

  useEffect(() => {
    let active = true;

    getMyOnboarding()
      .then((profile) => {
        if (!active) return;

        setAnswers(profile);
      })
      .catch(() => {
        if (active) setAnswers({});
      })
      .finally(() => {
        if (active) setLoadingAnswers(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getSavedProfiles()
      .then((profiles) => {
        if (active) setSavedCount(profiles.length);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  if (loading || !user || loadingAnswers) {
    return <PageSkeleton variant="profile" />;
  }

  const checklist = getProfileCompletionChecklist(user);
  const connectionsCount = connectionOverview?.accepted.length ?? 0;
  const pendingReceivedCount = connectionOverview?.received.length ?? 0;
  const locationLine = [community?.city, user.age ? `${user.age} años` : null]
    .filter(Boolean)
    .join(" · ");
  const communityHref = community ? "/mi-comunidad" : "/comunidades";
  // El acceso de propietario abre el recorrido de publicación antes que el
  // panel técnico: así la acción principal siempre es añadir una vivienda.
  const ownerHref = ownerProfile
    ? "/propietarios/pisos/nuevo"
    : "/propietarios/perfil";

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] space-y-4 px-6 py-6 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-7xl sm:rounded-sheet sm:p-7 lg:p-8"
    >
      {/* Antes esto era una tarjeta blanca que contenía otra tarjeta gris.
          Ese anidamiento no separaba nada: el contenido va directo sobre la
          superficie y el bloque pierde un borde y un fondo de ruido. */}
      <section className="relative overflow-hidden rounded-panel bg-surface p-5 shadow-soft sm:p-7 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
          <div className="min-w-0">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <Avatar
                  name={`${user.first_name} ${user.last_name}`}
                  imageUrl={user.avatar_url}
                  size={88}
                />
                <AvatarUploader
                  hasAvatar={Boolean(user.avatar_url)}
                  onUpdated={async () => {
                    await refresh();
                  }}
                />
              </div>

              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate font-rounded text-3xl font-bold tracking-[-0.04em] text-brand-dark">
                    {user.first_name}
                  </h1>
                  {user.is_email_verified && <VerifiedIcon />}
                </div>

                {locationLine && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <LocationIcon />
                    {locationLine}
                  </p>
                )}

                {/* Punto de color en vez de una píldora con borde: el estado
                    es un dato de una línea, no una etiqueta que compita con
                    el nombre. */}
                <p className="mt-2 flex items-center gap-2 text-2xs font-bold text-primary-dark sm:text-xs">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${user.is_looking_for_roommates ? "bg-primary" : "bg-muted"}`}
                  />
                  {user.is_looking_for_roommates
                    ? "Buscando compañero de piso"
                    : "No busca compañero ahora mismo"}
                </p>
              </div>
            </div>

            <p className={`mt-4 max-w-2xl text-sm leading-6 ${user.bio ? "text-secondary" : "text-muted"}`}>
              {user.bio || "Añade una breve presentación para que otras personas puedan conocerte antes de conectar."}
            </p>

            {/* Las dos acciones al mismo nivel y en la misma fila: editar y
                verse como te ven son la misma decisión vista de dos lados. */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <Link
                href="/perfil/editar"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button transition-colors duration-180 hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Editar perfil
              </Link>
              <Link
                href={`/personas/${user.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-soft px-5 text-sm font-bold text-primary-dark transition-colors duration-180 hover:bg-mint-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <EyeIcon />
                Vista pública
              </Link>
            </div>
          </div>

          <ProfileChecklistCard items={checklist} />
        </div>
      </section>

      {compatibilityScore && compatibilityScore.categories.length > 0 && (
        <CompatibilityRadar
          categories={compatibilityScore.categories}
          icon={<CompatibilityRadarIcon />}
          title="Tu perfil de convivencia"
          subtitle="Así te ven tus futuros compañeros"
        />
      )}

      {user.role === "OWNER" && !user.onboarding_completed && (
        <Link
          href="/onboarding"
          className="flex min-h-18 items-center gap-4 rounded-24 border border-primary/30 bg-primary/5 p-4 transition hover:border-primary/50"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CompatibilityRadarIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-dark">Activar perfil de convivencia</p>
            <p className="mt-0.5 text-xs leading-5 text-secondary">
              Haz el test y desbloquea tu perfil de convivencia, además del de propietario.
            </p>
          </div>
          <ChevronIcon />
        </Link>
      )}

      <section className="rounded-panel bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 px-1 font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">
          Tu espacio
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <IllustratedCard
            href={communityHref}
            image="/images/profile-community-3d.webp"
            imageAlt="Salón compartido"
            title="Mi comunidad"
            subtitle={community?.name ?? "Encuentra tu comunidad"}
          />
          <IllustratedCard
            href="/conexiones"
            image="/images/profile-connections-3d.webp"
            imageAlt="Burbujas de conversación"
            title="Conexiones"
            subtitle={`${connectionsCount} conexiones${pendingReceivedCount > 0 ? ` · ${pendingReceivedCount} pendientes` : ""}`}
          />
        </div>

        <Link
          href={ownerHref}
          className="mt-3 grid min-h-28 grid-cols-[7rem_1fr_auto] items-center overflow-hidden rounded-20 bg-surface-soft/70 transition-colors duration-180 hover:bg-black/[0.035] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:mt-4 sm:grid-cols-[9rem_1fr_auto]"
        >
          <div className="relative h-full min-h-28">
            <Image
              src="/images/profile-owner-house-3d.webp"
              alt="Casa ilustrada"
              fill
              sizes="(max-width: 640px) 112px, 144px"
              className="object-contain object-center p-2"
            />
          </div>
          <div className="py-4 pr-2">
            <p className="text-sm font-bold text-brand-dark sm:text-base">
              {ownerProfile ? "Tu espacio de propietario" : "¿Tienes una vivienda?"}
            </p>
            <p className="mt-1 text-xs leading-5 text-secondary sm:text-sm">
              {ownerProfile
                ? "Gestiona tus viviendas publicadas en CoFlow."
                : "Crea tu perfil de propietario y gestiona tus viviendas."}
            </p>
          </div>
          <span className="pr-3 text-muted sm:pr-4">
            <ChevronIcon />
          </span>
        </Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-2 rounded-panel bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="px-2 font-rounded text-lg font-semibold text-brand-dark">Mi CoFlow</h2>
          <div className="divide-y divide-border">
            <ProfileMenuRow href="/perfil/editar" icon={<UserIcon />} label="Editar mi perfil" />
            <ProfileMenuRow href="/perfil/preferencias" icon={<HomeIcon />} label="Preferencias de vivienda" />
            <ProfileMenuRow href="/personas/guardadas" icon={<BookmarkIcon />} label={`Perfiles guardados (${savedCount})`} />
          </div>
        </section>

        <section className="space-y-2 rounded-panel bg-surface p-4 shadow-sm sm:p-5">
          <h2 className="px-2 font-rounded text-lg font-semibold text-brand-dark">Cuenta</h2>
          <div className="divide-y divide-border">
            {user.role === "ADMIN" ? (
              <ProfileMenuRow href="/equipo/alta-asistida" icon={<HomeIcon />} label="Alta asistida de viviendas" />
            ) : null}
            <ProfileMenuRow href="/notificaciones" icon={<BellIcon />} label="Notificaciones" />
            <ProfileMenuRow href="/invitaciones" icon={<InvitationIcon />} label="Invitaciones" />
            <ProfileMenuRow href="/ajustes/privacidad" icon={<LockIcon />} label="Privacidad y seguridad" />
            <ProfileMenuRow href="/ajustes" icon={<SettingsIcon />} label="Ajustes" />
            <ProfileMenuRow href="/ayuda" icon={<HelpIcon />} label="Centro de ayuda" />
          </div>
        </section>
      </div>

      <section id="confianza" className="scroll-mt-24 space-y-3 rounded-panel bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">Detalles del perfil</h2>

        <YourProfileSection
          user={user}
          answers={answers}
          cityLabel={community?.city ?? null}
        />

        <RoommateSearchCard
          user={user}
          onUpdated={async () => {
            await refresh();
          }}
        />
      </section>

      <section className="space-y-3 rounded-panel bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="font-rounded text-xl font-semibold tracking-[-0.02em] text-brand-dark">Confianza</h2>
        <TrustSection user={user} />
      </section>

      <DangerZoneSection onLogout={logout} />
    </motion.div>
  );
}

function IllustratedCard({
  href,
  image,
  imageAlt,
  title,
  subtitle,
}: {
  href: string;
  image: string;
  imageAlt: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="overflow-hidden rounded-20 bg-surface-soft/70 text-left transition-colors duration-180 hover:bg-black/[0.035] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative h-28 sm:h-36">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 46vw, 320px"
          className="object-contain p-3 sm:p-4 lg:p-6"
        />
      </div>
      <div className="px-4 pb-4">
        <h3 className="text-sm font-bold text-brand-dark sm:text-base">
          {title}
        </h3>
        <p className="mt-1 truncate text-xs text-muted sm:text-sm">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}

function ProfileMenuRow({
  href,
  icon,
  label,
  badge,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  /** Ej. "Próximamente" — se muestra en vez del icono de flecha y
   * fuerza el estado deshabilitado (fila no navegable). */
  badge?: string;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center text-primary">
        {icon}
      </span>
      <span className="flex-1 text-sm font-semibold text-foreground">
        {label}
      </span>
      {badge ? (
        <span className="rounded-full bg-surface-soft px-2.5 py-1 text-2xs font-bold text-muted">
          {badge}
        </span>
      ) : (
        <ChevronIcon />
      )}
    </>
  );

  if (!href || badge) {
    return <div className="flex min-h-13 items-center gap-2 px-3 opacity-70">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="flex min-h-13 items-center gap-2 rounded-12 px-3 transition-colors duration-180 hover:bg-surface-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      {content}
    </Link>
  );
}

function VerifiedIcon() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white" aria-label="Email verificado">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
        <path d="m6 12 4 4 8-9" />
      </svg>
    </span>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-muted" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 shrink-0" aria-hidden="true">
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}


function UserIcon() {
  return <MenuIcon path={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />;
}

function HomeIcon() {
  return <MenuIcon path={<><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /></>} />;
}

function BookmarkIcon() {
  return <MenuIcon path={<path d="M6 3h12v18l-6-4-6 4V3Z" />} />;
}

function BellIcon() {
  return <MenuIcon path={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21h4" /></>} />;
}

function LockIcon() {
  return <MenuIcon path={<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>} />;
}

function HelpIcon() {
  return <MenuIcon path={<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5M12 17h.01" /></>} />;
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function InvitationIcon() {
  return <MenuIcon path={<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>} />;
}

function MenuIcon({ path }: { path: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      {path}
    </svg>
  );
}
