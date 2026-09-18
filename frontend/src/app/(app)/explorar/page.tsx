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
type PeopleFilter = "best" | "verified" | "budget";

const PREVIEW_COUNT_MIXED = 8;
const PREVIEW_COUNT_FOCUSED = 12;

export default function ExplorarPage() {
  const router = useRouter();
  const { user, loading, community } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const [segment, setSegment] = useState<Segment>("all");
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilter>("best");

  const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { communities, loading: communitiesLoading, error: communitiesError, refetch: refetchCommunities } = useCommunities();

  if (loading || !user) {
    return <PageSkeleton />;
  }

  const rankedUsers = [...users].sort((a, b) => {
    const scoreDifference = (b.match_score ?? -1) - (a.match_score ?? -1);
    if (scoreDifference !== 0) return scoreDifference;
    return Number(b.is_verified) - Number(a.is_verified);
  });
  const filteredUsers = rankedUsers.filter((person) => {
    if (peopleFilter === "verified") return person.is_verified;
    if (peopleFilter === "budget") return person.rental_budget !== null;
    return true;
  });
  const bestMatch = rankedUsers.find((person) => person.match_score !== null) ?? null;
  const hasMatchData = bestMatch !== null;
  const showBestMatch = Boolean(bestMatch) && (segment === "all" || peopleFilter === "best");

  const ctaHref = community ? "/perfil" : "/crear/comunidad";
  const ctaTitle = community ? "Revisa tu perfil" : "Crea tu comunidad";
  const ctaDescription = community
    ? "Mantén al día cómo eres y qué buscas."
    : "Empieza un grupo con tu forma de convivir.";

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

  return (
    <div className="explore-shell -mx-5 -mt-3 min-h-[calc(100dvh-var(--mobile-header-height))] [--explore-background:#f7f9f7] [--explore-card:#fff] px-5 pb-8 pt-3 sm:-mx-6 sm:px-6 md:mx-auto md:-mt-2 md:max-w-6xl md:rounded-sheet md:px-8 md:pb-10 md:pt-7">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary-dark">Hola, {user.first_name}</p>
          <h1 className="mt-1 font-rounded text-3xl font-semibold leading-none tracking-[-0.04em] text-brand-dark sm:text-4xl">
            Encuentra a tu gente
          </h1>
          <p className="mt-2 max-w-md text-sm leading-5 text-secondary">
            Compara cómo sería convivir antes de dar el primer paso.
          </p>
        </div>
        <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.05] bg-white px-3 text-xs font-bold text-primary-dark shadow-soft">
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
          collapsedPlaceholder={segment === "communities" ? "Buscar comunidades…" : "Buscar personas…"}
          placeholder=""
        />
      </div>

      <div role="tablist" aria-label="Tipo de contenido a explorar" className="mt-3 grid grid-cols-3 rounded-14 bg-black/[0.055] p-0.5">
        <SegmentPill active={segment === "all"} onClick={() => setSegment("all")}>Para ti</SegmentPill>
        <SegmentPill active={segment === "people"} onClick={() => setSegment("people")}>Personas</SegmentPill>
        <SegmentPill active={segment === "communities"} onClick={() => setSegment("communities")}>Comunidades</SegmentPill>
      </div>

      {!hasMatchData && segment !== "communities" && (
        <Link href={ctaHref} className="group mt-4 flex min-h-16 items-center gap-3 rounded-18 border border-primary/15 bg-mint-50 p-3 transition-colors hover:bg-primary/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:max-w-xl">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-soft"><SparkleIcon /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-brand-dark">{ctaTitle}</span>
            <span className="mt-0.5 block text-xs leading-5 text-secondary">{ctaDescription}</span>
          </span>
          <ChevronIcon className="h-4 w-4 shrink-0 text-primary-dark transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={segment}
          initial={contentInitial}
          animate={{ opacity: 1, y: 0 }}
          exit={contentExit}
          transition={{ duration, ease: MOTION_EASE.out }}
          className="mt-5 space-y-4"
        >
          {segment !== "communities" && (
            <div className="space-y-4">
              {!usersLoading && !usersError && bestMatch && showBestMatch && (
                <BestMatchCard person={bestMatch} />
              )}

              <DiscoveryRow
                title={showBestMatch ? "Más personas para ti" : "Personas para ti"}
                description="Ordenadas para ayudarte a decidir, no para hacerte deslizar sin fin."
                viewAllHref="/usuarios"
                loading={usersLoading}
                error={usersError}
                onRetry={refetchUsers}
                isEmpty={filteredUsers.filter((person) => !showBestMatch || person.id !== bestMatch?.id).length === 0}
                emptyMessage={peopleFilter === "best" ? "Todavía no hay personas para mostrar." : "No hay perfiles con este filtro por ahora."}
                skeletonWidth="w-64"
                skeletonHeight="h-28"
                controls={
                  segment === "people" ? (
                    <PeopleFilterBar value={peopleFilter} onChange={setPeopleFilter} />
                  ) : undefined
                }
              >
                {filteredUsers
                  .filter((person) => !showBestMatch || person.id !== bestMatch?.id)
                  .slice(
                    0,
                    segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED
                  )
                  .map((person) => (
                    <ExplorePersonCard key={person.id} person={person} />
                  ))}
              </DiscoveryRow>
            </div>
          )}

          {segment !== "people" && (
            <DiscoveryRow
              title="Comunidades para ti"
              description="Grupos con plazas disponibles y una forma de convivir definida."
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
      className={cn("relative min-h-11 rounded-[10px] px-2 text-xs font-bold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand", active ? "text-brand-dark" : "text-secondary")}
    >
      {active && <motion.span layoutId="explore-segment" className="absolute inset-0 rounded-[10px] bg-white shadow-soft" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function DiscoveryRow({
  title,
  description,
  viewAllHref,
  loading,
  error,
  onRetry,
  isEmpty,
  emptyMessage,
  skeletonWidth,
  skeletonHeight,
  controls,
  children,
}: {
  title: string;
  description?: string;
  viewAllHref: string;
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonWidth: string;
  skeletonHeight: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-24 border border-black/[0.04] bg-white py-4 shadow-overlay sm:py-5">
      <div className="mb-3 flex items-start justify-between gap-3 px-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="font-rounded text-lg font-semibold tracking-[-0.025em] text-brand-dark">
            {title}
          </h2>
          {description && <p className="mt-0.5 max-w-lg text-xs leading-5 text-secondary">{description}</p>}
        </div>

        <Link
          href={viewAllHref}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full px-2 text-xs font-bold text-primary transition hover:bg-black/[0.035]"
        >
          Ver todas
        </Link>
      </div>

      {controls && <div className="mb-3 px-4 sm:px-5">{controls}</div>}

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

function PeopleFilterBar({ value, onChange }: { value: PeopleFilter; onChange: (value: PeopleFilter) => void }) {
  const options: { value: PeopleFilter; label: string }[] = [
    { value: "best", label: "Mejor encaje" },
    { value: "verified", label: "Verificados" },
    { value: "budget", label: "Con presupuesto" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar personas">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-11 shrink-0 rounded-full border px-4 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            value === option.value
              ? "border-brand-dark bg-brand-dark text-white"
              : "border-black/[0.07] bg-white text-secondary hover:bg-surface-soft"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function personSubtitle(person: UserPublicProfile) {
  return person.community
    ? person.community.city
    : person.is_owner
      ? "Propietario"
      : "Busca comunidad";
}

function personImage(person: UserPublicProfile) {
  return [...person.photos].sort((a, b) => a.position - b.position)[0]?.image_url ?? person.avatar_url;
}

function strongestMatchLabels(person: UserPublicProfile, limit = 1) {
  return [...(person.match_breakdown?.categories ?? [])]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((category) => category.label);
}

function formatBudget(budget: number | null) {
  return budget === null ? "Presupuesto por completar" : `${budget.toLocaleString("es-ES")} € / mes`;
}

function BestMatchCard({ person }: { person: UserPublicProfile }) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();
  const subtitle = personSubtitle(person);
  const strengths = strongestMatchLabels(person, 2);
  const explanation = strengths.length > 0
    ? `Coincidís especialmente en ${strengths.join(" y ").toLowerCase()}.`
    : "Vuestros perfiles de convivencia tienen una afinidad alta.";

  return (
    <section className="overflow-hidden rounded-24 border border-primary/15 bg-mint-50 p-4 shadow-soft sm:p-5" aria-labelledby="best-match-title">
      <p className="text-2xs font-bold uppercase tracking-[0.12em] text-primary">Mejor coincidencia ahora</p>
      <div className="mt-3 flex items-start gap-3 sm:gap-4">
        <UserAvatar
          firstName={person.first_name}
          lastName={person.last_name}
          userId={person.id}
          imageUrl={personImage(person)}
          size="xl"
          className="ring-4 ring-white"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="best-match-title" className="truncate font-rounded text-xl font-semibold tracking-[-0.025em] text-brand-dark sm:text-2xl">
              {fullName || "Persona de CoFlow"}{person.age !== null ? `, ${person.age}` : ""}
            </h2>
            {person.match_score !== null && <MatchScoreBadge score={person.match_score} size="sm" />}
          </div>
          <p className="mt-1 text-xs font-semibold text-secondary">{subtitle}</p>
          <p className="mt-2 max-w-xl text-sm leading-5 text-brand-mid">{explanation}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
            <span>{formatBudget(person.rental_budget)}</span>
            {person.is_verified && <span className="inline-flex items-center gap-1 font-semibold text-primary-dark"><VerifiedIcon className="h-3.5 w-3.5" /> Perfil verificado</span>}
          </div>
        </div>
      </div>

      <Link
        href={`/personas/${person.id}`}
        transitionTypes={["nav-forward"]}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-dark px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
      >
        Ver por qué encajáis <ChevronIcon className="h-4 w-4" />
      </Link>
    </section>
  );
}

function ExplorePersonCard({ person }: { person: UserPublicProfile }) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();
  const subtitle = personSubtitle(person);
  const [strongestMatch] = strongestMatchLabels(person);

  return (
    <Link
      href={`/personas/${person.id}`}
      transitionTypes={["nav-forward"]}
      className="block w-64 shrink-0 snap-start rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-72"
    >
      <ViewTransition name={detailTransitionName("person", person.id)} share="coflow-detail-morph">
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="explore-card flex min-h-52 flex-col rounded-18 p-4"
      >
        <div className="flex items-start gap-3">
          <UserAvatar
            firstName={person.first_name}
            lastName={person.last_name}
            userId={person.id}
            imageUrl={personImage(person)}
            size="lg"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-center gap-1">
              <h3 className="truncate text-sm font-bold text-brand-dark">
                {fullName || "Persona de CoFlow"}{person.age !== null ? `, ${person.age}` : ""}
              </h3>
              {person.is_verified && <VerifiedIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </div>
            <p className="mt-0.5 truncate text-xs text-secondary">{subtitle}</p>
            {person.match_score !== null && <MatchScoreBadge score={person.match_score} size="sm" className="mt-2" />}
          </div>
        </div>

        <div className="mt-4 space-y-2 border-t border-black/[0.06] pt-3">
          {strongestMatch && (
            <p className="rounded-10 bg-mint-50 px-2.5 py-2 text-xs font-semibold text-primary-dark">
              Coincidís en {strongestMatch.toLowerCase()}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-secondary">Presupuesto</span>
            <span className="truncate font-bold text-brand-dark">{formatBudget(person.rental_budget)}</span>
          </div>
        </div>

        <span className="mt-auto flex items-center justify-between pt-4 text-xs font-bold text-primary-dark">
          Ver compatibilidad <ChevronIcon className="h-4 w-4" />
        </span>
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
  // Mismo criterio que en la tarjeta de persona: si la portada no
  // carga, se enseña la composición de avatares en vez de un hueco.
  const [coverFailed, setCoverFailed] = useState(false);

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
          {item.cover_image_url && !coverFailed ? (
            <Image
              src={item.cover_image_url}
              alt=""
              fill
              unoptimized
              sizes="272px"
              className="object-cover"
              onError={() => setCoverFailed(true)}
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
              <span className="shrink-0 rounded-full border border-primary/20 bg-surface px-1.5 py-0.5 text-3xs font-bold text-primary-dark shadow-soft">
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
