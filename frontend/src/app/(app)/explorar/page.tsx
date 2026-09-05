"use client";

import { useState, ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useCommunities } from "@/hooks/useCommunities";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ExplorerSearchBar from "@/components/explorer/ExplorerSearchBar";
import UserAvatar from "@/components/ui/UserAvatar";
import MatchScoreBadge from "@/components/usuario/MatchScoreBadge";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { cn } from "@/lib/utils";
import { detailTransitionName } from "@/lib/detailTransitions";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_EXPLORER_NAV_DISTANCE_DESKTOP,
  MOTION_EXPLORER_NAV_DISTANCE_MOBILE,
  MOTION_EXPLORER_NAV_DURATION_DESKTOP,
  MOTION_EXPLORER_NAV_DURATION_MOBILE,
} from "@/lib/motionTokens";
import type { UserPublicProfile } from "@/types/userPublic";
import type { Community } from "@/types/community";

type Segment = "all" | "people" | "communities";

const PREVIEW_COUNT_MIXED = 8;
const PREVIEW_COUNT_FOCUSED = 12;

export default function ExplorarPage() {
  const router = useRouter();
  const { user, loading, community } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const [segment, setSegment] = useState<Segment>("all");

  const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { communities, loading: communitiesLoading, error: communitiesError, refetch: refetchCommunities } = useCommunities();

  if (loading || !user) {
    return <PageSkeleton />;
  }

  const ctaHref = community ? "/perfil" : "/crear/comunidad";
  const ctaTitle = community ? "Completa tu perfil" : "Crea tu comunidad";
  const ctaDescription = community
    ? "Genera más confianza entre quienes lo ven."
    : "Empieza tu espacio en CoFlow.";

  function handleSearchOpen() {
    router.push(segment === "communities" ? "/comunidades" : "/usuarios");
  }

  const distance = isDesktop
    ? MOTION_EXPLORER_NAV_DISTANCE_DESKTOP
    : MOTION_EXPLORER_NAV_DISTANCE_MOBILE;

  const duration = isDesktop
    ? MOTION_EXPLORER_NAV_DURATION_DESKTOP
    : MOTION_EXPLORER_NAV_DURATION_MOBILE;

  const contentInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: distance };

  const contentExit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -distance };

  const heroPeople = users.slice(0, 3);

  return (
    <div className="explore-shell -mx-5 -mt-3 min-h-[calc(100dvh-var(--mobile-header-height))] px-5 pb-8 pt-3 sm:-mx-6 sm:px-6 md:mx-auto md:-mt-2 md:max-w-6xl md:rounded-[32px] md:px-8 md:pb-10 md:pt-7">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-secondary">Hola, {user.first_name}</p>
          <h1 className="mt-0.5 font-rounded text-[32px] font-semibold leading-none tracking-[-0.04em] text-brand-dark sm:text-4xl">
            Explorar
          </h1>
        </div>
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-primary-dark shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
          <LocationPinIcon /> Málaga
        </span>
      </header>

      <div className="mt-5">
        <ExplorerSearchBar
          layoutIdBar="explorar-search-bar"
          layoutIdIcon="explorar-search-icon"
          searchOpen={false}
          onOpen={handleSearchOpen}
          onBack={() => {}}
          value=""
          onChange={() => {}}
          onClear={() => {}}
          collapsedPlaceholder="Personas, comunidades, barrios…"
          placeholder=""
        />
      </div>

      <div role="tablist" aria-label="Tipo de contenido a explorar" className="mt-3 grid grid-cols-3 rounded-14 bg-black/[0.055] p-0.5">
        <SegmentPill active={segment === "all"} onClick={() => setSegment("all")}>Para ti</SegmentPill>
        <SegmentPill active={segment === "people"} onClick={() => setSegment("people")}>Personas</SegmentPill>
        <SegmentPill active={segment === "communities"} onClick={() => setSegment("communities")}>Comunidades</SegmentPill>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-[1.35fr_0.65fr]">
        <Link href="/usuarios" className="group relative min-h-44 overflow-hidden rounded-24 bg-brand-dark p-5 text-white shadow-[0_16px_40px_-26px_rgb(10_45_33/0.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <div className="relative z-10 max-w-[24rem]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Selección para ti</p>
            <h2 className="mt-2 font-rounded text-2xl font-semibold leading-tight tracking-[-0.03em]">Encuentra personas con las que encajar de verdad.</h2>
            <p className="mt-2 text-sm leading-5 text-white/70">Compara hábitos, presupuesto y forma de convivir antes de escribir.</p>
          </div>
          <div className="relative z-10 mt-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-sm font-bold">Ver personas <ChevronIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            {heroPeople.length > 0 && <AvatarStack people={heroPeople} />}
          </div>
          <span aria-hidden="true" className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
          <span aria-hidden="true" className="absolute -bottom-20 right-12 h-40 w-40 rounded-full bg-white/[0.035]" />
        </Link>

        <Link href={ctaHref} className="group flex min-h-36 flex-col justify-between rounded-24 border border-black/[0.04] bg-white p-5 shadow-[0_10px_30px_-24px_rgb(0_0_0/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:min-h-44">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.045] text-primary"><SparkleIcon /></span>
          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Siguiente paso</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <div><h2 className="font-rounded text-lg font-semibold text-brand-dark">{ctaTitle}</h2><p className="mt-0.5 text-xs leading-5 text-secondary">{ctaDescription}</p></div>
              <ChevronIcon className="mb-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={segment}
          initial={contentInitial}
          animate={{ opacity: 1, y: 0 }}
          exit={contentExit}
          transition={{ duration, ease: MOTION_EASE.out }}
          className="mt-6 space-y-4"
        >
          {segment !== "communities" && (
            <DiscoveryRow
              title="Personas para conocer"
              viewAllHref="/usuarios"
              loading={usersLoading}
              error={usersError}
              onRetry={refetchUsers}
              isEmpty={users.length === 0}
              emptyMessage="Todavía no hay personas para mostrar."
              skeletonWidth="w-56"
              skeletonHeight="h-52"
            >
              {users
                .slice(
                  0,
                  segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED
                )
                .map((person) => (
                  <ExplorePersonCard key={person.id} person={person} />
                ))}
            </DiscoveryRow>
          )}

          {segment !== "people" && (
            <DiscoveryRow
              title="Comunidades"
              viewAllHref="/comunidades"
              loading={communitiesLoading}
              error={communitiesError}
              onRetry={refetchCommunities}
              isEmpty={communities.length === 0}
              emptyMessage="Todavía no hay comunidades para mostrar."
              skeletonWidth="w-68"
              skeletonHeight="h-48"
            >
              {communities
                .slice(
                  0,
                  segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED
                )
                .map((item) => (
                  <ExploreCommunityCard
                    key={item.id}
                    item={item}
                    isOwn={item.id === community?.id}
                  />
                ))}
            </DiscoveryRow>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}

function SegmentPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn("relative min-h-9 rounded-[10px] px-2 text-xs font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand", active ? "text-brand-dark" : "text-secondary")}
    >
      {active && <motion.span layoutId="explore-segment" className="absolute inset-0 rounded-[10px] bg-white shadow-[0_1px_3px_rgb(0_0_0/0.1)]" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function DiscoveryRow({
  title,
  viewAllHref,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage,
  skeletonWidth,
  skeletonHeight,
  children,
}: {
  title: string;
  viewAllHref: string;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonWidth: string;
  skeletonHeight: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-24 border border-black/[0.04] bg-white py-4 shadow-[0_10px_30px_-26px_rgb(0_0_0/0.3)] sm:py-5">
      <div className="mb-3 flex items-center justify-between gap-3 px-4 sm:px-5">
        <h2 className="whitespace-nowrap font-rounded text-[19px] font-semibold tracking-[-0.025em] text-brand-dark">
          {title}
        </h2>

        <Link
          href={viewAllHref}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full px-2 text-xs font-bold text-primary transition hover:bg-black/[0.035]"
        >
          Ver todas
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 sm:px-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={cn(skeletonWidth, "shrink-0")}>
              <SkeletonCard
                withCover
                coverClassName={skeletonHeight}
                className="[&>div:last-child]:hidden"
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mx-4 flex min-h-28 items-center justify-between gap-4 rounded-18 bg-[#f5f7f5] px-4 py-3 sm:mx-5">
          <div><p className="text-sm font-bold text-brand-dark">No se pudo cargar</p><p className="mt-0.5 text-xs leading-5 text-secondary">{error}</p></div>
          <button type="button" onClick={onRetry} className="min-h-10 shrink-0 rounded-full bg-white px-4 text-xs font-bold text-primary-dark shadow-soft">Reintentar</button>
        </div>
      ) : isEmpty ? (
        <div className="px-4 sm:px-5"><EmptyState title={emptyMessage} /></div>
      ) : (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:px-5">
          {children}
          <Link href={viewAllHref} className="flex min-h-40 w-28 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-18 bg-black/[0.035] text-center text-xs font-bold text-primary-dark focus-visible:outline-2 focus-visible:outline-brand">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft"><ChevronIcon className="h-4 w-4" /></span>
            Ver todas
          </Link>
        </div>
      )}
    </section>
  );
}

/** Preview compacto para el Home — no es la ficha de búsqueda
 * profunda (esa vive en /usuarios vía UserCard). Dos variantes según
 * dato real disponible: con foto, la imagen protagoniza; sin foto, no
 * reservamos una superficie enorme vacía — card mucho más compacta. */
function ExplorePersonCard({ person }: { person: UserPublicProfile }) {
  return person.avatar_url ? (
    <PersonPhotoCard person={person} />
  ) : (
    <PersonNoPhotoCard person={person} />
  );
}

function personSubtitle(person: UserPublicProfile) {
  return person.community
    ? person.community.city
    : person.is_owner
      ? "Propietario"
      : "Busca comunidad";
}

function PersonPhotoCard({ person }: { person: UserPublicProfile }) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();
  const subtitle = personSubtitle(person);

  return (
    <Link
      href={`/personas/${person.id}`}
      transitionTypes={["nav-forward"]}
      className="block w-48 shrink-0 snap-start rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-52"
    >
      <ViewTransition name={detailTransitionName("person", person.id)} share="coflow-detail-morph">
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="explore-card overflow-hidden rounded-18"
      >
        <div className="relative h-48 bg-surface-muted sm:h-52">
          <Image
            src={person.avatar_url!}
            alt=""
            fill
            unoptimized
            sizes="224px"
            className="object-cover"
          />

          {person.is_verified && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-primary shadow-soft">
              <VerifiedIcon className="h-3.5 w-3.5" />
            </span>
          )}
          {person.match_score !== null && (
            <MatchScoreBadge score={person.match_score} size="sm" className="absolute bottom-2 left-2 border-0 bg-white/95" />
          )}
        </div>

        <div className="p-3">
          <p className="truncate text-sm font-bold text-brand-dark">
            {fullName || "Persona de CoFlow"}
            {person.age !== null && (
              <span className="font-medium text-secondary">, {person.age}</span>
            )}
          </p>

          {subtitle && (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          )}
        </div>
      </motion.div>
      </ViewTransition>
    </Link>
  );
}

/** Sin foto: card compacta propia, no una versión vacía de la de
 * foto. Nada de superficie gigante ni avatar flotando en el vacío. */
function PersonNoPhotoCard({ person }: { person: UserPublicProfile }) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();
  const subtitle = personSubtitle(person);

  return (
    <Link
      href={`/personas/${person.id}`}
      transitionTypes={["nav-forward"]}
      className="block w-44 shrink-0 snap-start rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-48"
    >
      <ViewTransition name={detailTransitionName("person", person.id)} share="coflow-detail-morph">
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="explore-card relative flex h-52 flex-col items-center justify-center gap-2 overflow-hidden rounded-18 p-4 text-center"
      >
        <ChevronIcon className="absolute right-3 top-3 h-4 w-4 text-border" />

        <UserAvatar
          firstName={person.first_name}
          lastName={person.last_name}
          userId={person.id}
          size="lg"
        />
        {person.match_score !== null && <MatchScoreBadge score={person.match_score} size="sm" />}

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-brand-dark">
            {fullName || "Persona de CoFlow"}
            {person.age !== null && (
              <span className="font-medium text-secondary">, {person.age}</span>
            )}
          </p>

          {subtitle && (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          )}
        </div>
      </motion.div>
      </ViewTransition>
    </Link>
  );
}

/** Preview compacto de comunidad — cover real si existe, si no una
 * composición de avatares limpia (sin verde plano). Metadata máxima
 * de dos líneas; nada de CTA interno. */
function ExploreCommunityCard({
  item,
  isOwn,
}: {
  item: Community;
  isOwn: boolean;
}) {
  const visibleMembers = item.members.slice(0, 3);

  return (
    <Link
      href={`/comunidades/${item.id}`}
      transitionTypes={["nav-forward"]}
      className="block w-60 shrink-0 snap-start rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-64"
    >
      <ViewTransition name={detailTransitionName("community", item.id)} share="coflow-detail-morph">
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="explore-card overflow-hidden rounded-18"
      >
        <div className="relative h-32 bg-surface-muted">
          {item.cover_image_url ? (
            <Image
              src={item.cover_image_url}
              alt=""
              fill
              unoptimized
              sizes="272px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center -space-x-3">
              {visibleMembers.length > 0 ? (
                visibleMembers.map((member) => (
                  <UserAvatar
                    key={member.id}
                    firstName={member.user.first_name}
                    lastName={member.user.last_name}
                    userId={member.user.id}
                    imageUrl={member.user.avatar_url}
                    size="lg"
                    className="border-2 border-surface"
                  />
                ))
              ) : (
                <div className="rounded-full ring-4 ring-border/50">
                  <UserAvatar
                    firstName={item.name}
                    userId={String(item.id)}
                    size="lg"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-2.5">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-bold text-brand-dark">
              {item.name}
            </p>

            {isOwn && (
              <span className="shrink-0 rounded-full border border-primary/20 bg-surface px-1.5 py-0.5 text-[10px] font-bold text-primary-dark shadow-soft">
                Tuya
              </span>
            )}
          </div>

          <p className="truncate text-xs text-muted">
            {item.city}
            {" · "}
            {item.member_count}{" "}
            {item.member_count === 1 ? "miembro" : "miembros"}
            {item.open_spots > 0 &&
              ` · ${item.open_spots} ${item.open_spots === 1 ? "plaza" : "plazas"}`}
          </p>
        </div>
      </motion.div>
      </ViewTransition>
    </Link>
  );
}

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="m12 3 1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
    </svg>
  );
}

function AvatarStack({ people }: { people: UserPublicProfile[] }) {
  return (
    <span className="flex -space-x-2" aria-label={`${people.length} personas disponibles`}>
      {people.map((person) => (
        <UserAvatar
          key={person.id}
          firstName={person.first_name}
          lastName={person.last_name}
          userId={person.id}
          imageUrl={person.avatar_url}
          size="sm"
          className="border-2 border-brand-dark"
        />
      ))}
    </span>
  );
}

function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
