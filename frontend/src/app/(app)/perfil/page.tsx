"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import TrustSection from "@/components/perfil/TrustProfileCard";
import YourProfileSection from "@/components/perfil/YourProfileSection";
import RoommateSearchCard from "@/components/perfil/RoommateSearchCard";
import DangerZoneSection from "@/components/perfil/DangerZoneSection";
import Spinner from "@/components/ui/Spinner";
import CompatibilityRadar, { CompatibilityRadarIcon } from "@/components/convivencia/CompatibilityRadar";
import { getMyOnboarding } from "@/services/onboarding";
import { getMyCompatibilityScore, getSavedProfiles } from "@/services/users";
import { getConnectionOverview } from "@/services/connections";
import { CONNECTION_OVERVIEW_QUERY_KEY } from "@/lib/connectionQueryState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { SOLVENCY_PASSPORT_ENABLED } from "@/lib/featureFlags";
import { computeProfileCompletion, getProfileCompletionChecklist } from "@/lib/profileCompletion";
import type { OnboardingAnswers } from "@/types/onboarding";

export default function PerfilPage() {
  const { user, loading, ownerProfile, community, logout, refresh } = useAuth();
  const prefersReducedMotion = useReducedMotion();

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
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const completion = computeProfileCompletion(user);
  const missingItems = getProfileCompletionChecklist(user).filter(
    (item) => !item.done
  );
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
      className="mx-auto w-full max-w-7xl space-y-5 pb-4 sm:space-y-7"
    >
      <section className="relative overflow-hidden rounded-24 border border-primary/20 bg-mint-50 shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-primary/15 px-4 py-3 sm:block sm:px-7 sm:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-dark/60 sm:text-[11px] sm:tracking-[0.14em]">
            Tu identidad en CoFlow
          </p>
          <h1 className="font-rounded text-base font-semibold text-brand-dark sm:mt-0.5 sm:text-lg">
            Mi perfil
          </h1>
        </div>

        <div className="grid gap-4 p-4 sm:gap-7 sm:p-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-10 lg:p-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="relative shrink-0 rounded-full border-4 border-white shadow-soft">
              <Avatar
                name={`${user.first_name} ${user.last_name}`}
                imageUrl={user.avatar_url}
                size={96}
              />
              <AvatarUploader
                hasAvatar={Boolean(user.avatar_url)}
                onUpdated={async () => {
                  await refresh();
                }}
              />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-4xl">
                    {user.first_name}
                  </h2>
                  {user.is_email_verified && <VerifiedIcon />}
                </div>

                {locationLine && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <LocationIcon />
                    {locationLine}
                  </p>
                )}

                <span className="mt-2 inline-flex rounded-full border border-primary/15 bg-white/75 px-2.5 py-1 text-[11px] font-bold text-primary-dark sm:mt-3 sm:px-3 sm:py-1.5 sm:text-xs">
                  {user.is_looking_for_roommates
                    ? "Buscando compañero de piso"
                    : "No busca compañero ahora mismo"}
                </span>
              </div>
            </div>

            {user.bio ? (
              <p className="mt-4 line-clamp-2 max-w-2xl text-sm leading-5 text-secondary sm:mt-5 sm:line-clamp-none sm:leading-6">{user.bio}</p>
            ) : (
              <p className="mt-4 line-clamp-2 max-w-xl text-sm leading-5 text-secondary sm:mt-5 sm:line-clamp-none sm:leading-6">
                Añade una breve presentación para que otras personas puedan conocerte antes de conectar.
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:flex-row">
              <Link
                href="/perfil/editar"
                className="inline-flex min-h-11 items-center justify-center rounded-14 bg-brand-dark px-3 text-xs font-bold text-white shadow-button transition hover:bg-primary-dark sm:px-5 sm:text-sm"
              >
                <span className="sm:hidden">Editar</span>
                <span className="hidden sm:inline">Editar mi perfil</span>
              </Link>
              <Link
                href={`/personas/${user.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-14 border border-primary/25 bg-white/75 px-3 text-xs font-bold text-primary-dark transition hover:bg-white sm:gap-2 sm:px-5 sm:text-sm"
              >
                <span className="[&>svg]:h-4 [&>svg]:w-4"><EyeIcon /></span>
                <span className="sm:hidden">Ver público</span>
                <span className="hidden sm:inline">Ver perfil público</span>
              </Link>
            </div>
          </div>

          <div className="rounded-18 border border-white/80 bg-white/70 p-4 backdrop-blur-sm sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Perfil completado
                </p>
                <p className="mt-0.5 font-rounded text-2xl font-semibold text-brand-dark sm:mt-1 sm:text-3xl">
                  {completion}%
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-12 sm:w-12">
                <ProfileSparkIcon />
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10 sm:mt-4">
              <motion.div
                initial={{ width: prefersReducedMotion ? `${completion}%` : 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
                className="h-full rounded-full bg-primary"
              />
            </div>

            {missingItems.length > 0 ? (
              <div className="mt-3 sm:mt-4">
                <div className="flex flex-wrap gap-1.5 sm:hidden">
                  {missingItems.slice(0, 2).map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="inline-flex min-h-8 items-center rounded-full bg-mint-50 px-3 py-1 text-[11px] font-bold text-primary-dark"
                    >
                      + {item.label}
                    </Link>
                  ))}
                  {missingItems.length > 2 && (
                    <Link
                      href="/perfil/editar"
                      className="inline-flex min-h-8 items-center rounded-full border border-primary/15 px-3 py-1 text-[11px] font-bold text-primary-dark"
                    >
                      +{missingItems.length - 2} pendientes
                    </Link>
                  )}
                </div>
                <div className="hidden flex-wrap gap-1.5 sm:flex">
                  {missingItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="inline-flex min-h-8 items-center gap-1 rounded-full bg-mint-50 px-3 py-1 text-xs font-bold text-primary-dark transition hover:bg-mint-100"
                    >
                      + {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-primary-dark">
                Tu perfil está listo para compartir.
              </p>
            )}
          </div>
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

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
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
      </section>

      <Link
        href={ownerHref}
        className="grid min-h-32 grid-cols-[42%_1fr_auto] items-center overflow-hidden rounded-24 border border-border/60 bg-surface transition hover:border-primary/25 lg:min-h-40 lg:grid-cols-[280px_1fr_auto]"
      >
        <div className="relative h-full min-h-32 bg-surface-soft/30 lg:min-h-40">
          <Image
            src="/images/profile-owner-house-3d.webp"
            alt="Casa ilustrada"
            fill
            sizes="(max-width: 640px) 42vw, 300px"
            className="object-contain object-center p-2 lg:p-5"
          />
        </div>
        <div className="py-4 pr-2">
          <p className="text-base font-bold text-brand-dark">
            {ownerProfile ? "Tu espacio de propietario" : "¿Tienes una vivienda?"}
          </p>
          <p className="mt-1 text-xs leading-5 text-secondary sm:text-sm">
            {ownerProfile
              ? "Gestiona tus viviendas publicadas en CoFlow."
              : "Crea tu perfil de propietario y gestiona tus viviendas."}
          </p>
        </div>
        <span className="pr-4 text-muted">
          <ChevronIcon />
        </span>
      </Link>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-bold text-primary-dark">Mi CoFlow</h2>
        <div className="divide-y divide-border rounded-18 border border-border/60 bg-surface">
          <ProfileMenuRow href="/perfil/editar" icon={<UserIcon />} label="Editar mi perfil" />
          <ProfileMenuRow
            href={SOLVENCY_PASSPORT_ENABLED ? "/pasaporte" : undefined}
            icon={<ShieldIcon />}
            label="Pasaporte de solvencia"
            badge={SOLVENCY_PASSPORT_ENABLED ? undefined : "Próximamente"}
          />
          <ProfileMenuRow href="/perfil/preferencias" icon={<HomeIcon />} label="Preferencias de vivienda" />
          <ProfileMenuRow href="/personas/guardadas" icon={<BookmarkIcon />} label={`Perfiles guardados (${savedCount})`} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-bold text-primary-dark">Cuenta</h2>
        <div className="divide-y divide-border rounded-18 border border-border/60 bg-surface">
          <ProfileMenuRow href="/notificaciones" icon={<BellIcon />} label="Notificaciones" />
          <ProfileMenuRow href="/invitaciones" icon={<InvitationIcon />} label="Invitaciones" />
          <ProfileMenuRow href="/ajustes/privacidad" icon={<LockIcon />} label="Privacidad y seguridad" />
          <ProfileMenuRow href="/ajustes" icon={<SettingsIcon />} label="Ajustes" />
          <ProfileMenuRow href="/ayuda" icon={<HelpIcon />} label="Centro de ayuda" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Completa tu perfil</h2>

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

      <section className="space-y-3">
        <h2 className="text-base font-bold text-brand-dark">Confianza</h2>
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
      className="overflow-hidden rounded-24 border border-border/60 bg-surface text-center transition hover:-translate-y-0.5 hover:border-primary/25"
    >
      <div className="relative h-32 bg-surface-soft/30 sm:h-44 lg:h-48">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 46vw, 320px"
          className="object-contain p-3 sm:p-4 lg:p-6"
        />
      </div>
      <div className="px-3 pb-4">
        <h3 className="text-base font-bold text-brand-dark sm:text-lg">
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
        <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-muted">
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
      className="flex min-h-13 items-center gap-2 px-3 transition hover:bg-surface-soft"
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

function ProfileSparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="m18 3 .7 1.8L20.5 5.5l-1.8.7L18 8l-.7-1.8-1.8-.7 1.8-.7Z" />
    </svg>
  );
}

function UserIcon() {
  return <MenuIcon path={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />;
}

function ShieldIcon() {
  return <MenuIcon path={<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z" />} />;
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
