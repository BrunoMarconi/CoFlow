"use client";

import { useState, ViewTransition, type CSSProperties } from "react";
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
import { getHabitChips } from "@/lib/habitLabels";
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

const SEGMENT_ORDER: Segment[] = ["all", "people", "communities"];
const PREVIEW_COUNT_MIXED = 8;
const PREVIEW_COUNT_FOCUSED = 12;

export default function ExplorarPage() {
  const router = useRouter();
  const { user, loading, community } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [segment, setSegment] = useState<Segment>("all");
  const [direction, setDirection] = useState(1);

  const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { communities, loading: communitiesLoading, error: communitiesError, refetch: refetchCommunities } = useCommunities();

  if (loading || !user) {
    return <PageSkeleton />;
  }

  const ctaHref = community ? "/perfil" : "/crear/comunidad";
  const ctaTitle = community ? "Revisa tu perfil" : "Crea tu comunidad";
  const ctaDescription = community
    ? "Mantén al día cómo eres y qué buscas."
    : "Empieza un grupo con tu forma de convivir.";

  function selectSegment(next: Segment) {
    setDirection(SEGMENT_ORDER.indexOf(next) >= SEGMENT_ORDER.indexOf(segment) ? 1 : -1);
    setSegment(next);
  }

  function handleBrowseOpen() {
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
    : { opacity: 0, x: direction * distance };
  const contentExit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, x: -direction * distance };

  return (
    <div className="explore-shell -mx-5 -mt-3 min-h-[calc(100dvh-var(--mobile-header-height))] bg-white px-5 pb-10 pt-4 sm:-mx-6 sm:px-6 md:mx-auto md:-mt-2 md:max-w-7xl md:px-8 md:pb-14 md:pt-8">
      <header className="stagger-in flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#627D70]">Hola, {user.first_name}</p>
          <h1 className="mt-1 font-rounded text-4xl font-semibold leading-none tracking-[-0.045em] text-brand-dark sm:text-5xl">
            Explorar
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-secondary sm:text-base">
            Encuentra personas con las que realmente encajas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBrowseOpen}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[#627D70]/15 bg-white px-4 text-xs font-bold text-primary-dark shadow-[0_8px_24px_rgba(51,78,66,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#627D70]/30 hover:bg-[#f7faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70] motion-reduce:transform-none"
          aria-label="Cambiar ubicación. Ubicación actual: Málaga"
        >
          <LocationPinIcon />
          Málaga
          <ChevronDownIcon />
        </button>
      </header>

      <div className="stagger-in mt-7" style={{ "--i": 1 } as CSSProperties}>
        <ExplorerSearchBar
          layoutIdBar="explorar-search-bar"
          layoutIdIcon="explorar-search-icon"
          searchOpen={false}
          onOpen={handleBrowseOpen}
          onBack={() => {}}
          value=""
          onChange={() => {}}
          onClear={() => {}}
          collapsedPlaceholder={segment === "communities" ? "Buscar comunidades" : "Buscar personas compatibles"}
          placeholder=""
          collapsedRightSlot={<FilterButton onClick={handleBrowseOpen} />}
        />
      </div>

      <div
        role="tablist"
        aria-label="Tipo de contenido a explorar"
        className="stagger-in mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ "--i": 2 } as CSSProperties}
      >
        <SegmentPill active={segment === "all"} onClick={() => selectSegment("all")}>Para ti</SegmentPill>
        <SegmentPill active={segment === "people"} onClick={() => selectSegment("people")}>Personas</SegmentPill>
        <SegmentPill active={segment === "communities"} onClick={() => selectSegment("communities")}>Comunidades</SegmentPill>
      </div>

      <Link
        href={ctaHref}
        style={{ "--i": 3 } as CSSProperties}
        className="stagger-in group mt-6 flex min-h-18 items-center gap-3 rounded-18 border border-[#627D70]/10 bg-[#f7faf8] p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#627D70]/20 hover:shadow-[0_12px_32px_rgba(51,78,66,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70] motion-reduce:transform-none sm:max-w-xl"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#627D70] shadow-soft"><SparkleIcon /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-brand-dark">{ctaTitle}</span>
          <span className="mt-0.5 block text-xs leading-5 text-secondary">{ctaDescription}</span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-[#627D70] transition-transform group-hover:translate-x-0.5" />
      </Link>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={segment}
          initial={contentInitial}
          animate={{ opacity: 1, x: 0 }}
          exit={contentExit}
          transition={{ duration, ease: MOTION_EASE.out }}
          className="mt-8 space-y-10"
        >
          {segment !== "communities" && (
            <DiscoveryRow
              title="Personas compatibles contigo"
              description="Perfiles que comparten tu forma de convivir."
              viewAllHref="/usuarios"
              loading={usersLoading}
              error={usersError}
              onRetry={refetchUsers}
              isEmpty={users.length === 0}
              emptyMessage="Todavía no hay personas para mostrar."
              skeletonWidth="w-64"
              skeletonHeight="h-80"
            >
              {users
                .slice(0, segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED)
                .map((person, index) => (
                  <ExplorePersonCard key={person.id} person={person} index={index} />
                ))}
            </DiscoveryRow>
          )}

          {segment !== "people" && (
            <DiscoveryRow
              title="Comunidades que encajan contigo"
              description="Grupos que buscan una convivencia parecida a la tuya."
              viewAllHref="/comunidades"
              loading={communitiesLoading}
              error={communitiesError}
              onRetry={refetchCommunities}
              isEmpty={communities.length === 0}
              emptyMessage="Todavía no hay comunidades para mostrar."
              skeletonWidth="w-72"
              skeletonHeight="h-72"
            >
              {communities
                .slice(0, segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED)
                .map((item, index) => (
                  <ExploreCommunityCard
                    key={item.id}
                    item={item}
                    index={index}
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

function SegmentPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative min-h-11 shrink-0 overflow-hidden rounded-full border px-5 text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70]",
        active
          ? "border-[#627D70] text-white"
          : "border-black/[0.07] bg-white text-secondary hover:border-[#627D70]/25 hover:bg-[#f7faf8] hover:text-primary-dark"
      )}
    >
      {active && (
        <motion.span
          layoutId="explore-segment"
          className="absolute inset-0 bg-[#627D70]"
          transition={{ type: "spring", stiffness: 450, damping: 36 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function FilterButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-14 shrink-0 items-center gap-2 rounded-full border border-[#627D70]/15 bg-white px-4 text-sm font-bold text-primary-dark shadow-[0_8px_24px_rgba(51,78,66,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#627D70]/30 hover:bg-[#f7faf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70] motion-reduce:transform-none"
    >
      <FilterIcon />
      <span className="hidden sm:inline">Filtros</span>
      <span className="sr-only sm:hidden">Abrir filtros</span>
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
  children,
}: {
  title: string;
  description: string;
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
  const headingId = `${title.replaceAll(" ", "-").toLowerCase()}-title`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={headingId} className="font-rounded text-xl font-semibold tracking-[-0.03em] text-brand-dark sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 hidden text-sm text-secondary sm:block">{description}</p>
        </div>
        <Link
          href={viewAllHref}
          className="group inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-bold text-[#627D70] transition hover:bg-[#f1f6f3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70]"
        >
          Ver todas
          <ChevronIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={cn(skeletonWidth, "shrink-0")}>
              <SkeletonCard withCover coverClassName={skeletonHeight} className="[&>div:last-child]:hidden" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex min-h-28 items-center justify-between gap-4 rounded-18 border border-black/[0.05] bg-[#f7faf8] px-4 py-3">
          <div><p className="text-sm font-bold text-brand-dark">No se pudo cargar</p><p className="mt-0.5 text-xs leading-5 text-secondary">{error}</p></div>
          <button type="button" onClick={onRetry} className="min-h-10 shrink-0 rounded-full bg-white px-4 text-xs font-bold text-primary-dark shadow-soft">Reintentar</button>
        </div>
      ) : isEmpty ? (
        <div className="rounded-18 border border-black/[0.05] p-4"><EmptyState title={emptyMessage} /></div>
      ) : (
        <div className="scroll-fade-live flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
          <Link href={viewAllHref} className="group flex min-h-72 w-32 shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-24 border border-dashed border-[#627D70]/25 bg-[#f7faf8] text-center text-xs font-bold text-primary-dark transition hover:border-[#627D70]/45 hover:bg-[#eff5f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70]">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-soft"><ChevronIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
            Ver todas
          </Link>
        </div>
      )}
    </section>
  );
}

function ExplorePersonCard({ person, index }: { person: UserPublicProfile; index: number }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const fullName = `${person.first_name} ${person.last_name}`.trim();
  const location = person.community?.city ?? (person.is_owner ? "Propietario" : "Busca comunidad");
  const profilePhoto = [...person.photos].sort((a, b) => a.position - b.position)[0]?.image_url ?? person.avatar_url;
  const habitChips = getHabitChips(person.preferences).slice(0, 3);

  return (
    <Link
      href={`/personas/${person.id}`}
      transitionTypes={["nav-forward"]}
      style={{ "--i": index + 4 } as CSSProperties}
      className="stagger-in group block w-64 shrink-0 snap-start rounded-24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70] sm:w-68"
    >
      <ViewTransition name={detailTransitionName("person", person.id)} share="coflow-detail-morph">
        <motion.article
          whileHover={prefersReducedMotion ? undefined : { y: -4 }}
          whileTap={{ scale: 0.975 }}
          transition={{ duration: MOTION_DURATION.fast }}
          className="explore-card flex h-full min-h-92 flex-col overflow-hidden rounded-24 border border-black/[0.065] bg-white shadow-[0_10px_30px_rgba(42,62,53,0.07)] transition-shadow duration-200 group-hover:shadow-[0_18px_44px_rgba(42,62,53,0.13)]"
        >
          <div className="relative h-60 overflow-hidden bg-[#edf2ef]">
            {profilePhoto && !photoFailed ? (
              <Image
                src={profilePhoto}
                alt={`Foto de ${fullName || person.first_name}`}
                fill
                unoptimized
                sizes="(min-width: 640px) 272px, 256px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035] motion-reduce:transform-none"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-[#e7efeb] via-[#f5f8f6] to-[#dce7e1]">
                <span className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none">
                  <UserAvatar firstName={person.first_name} lastName={person.last_name} userId={person.id} size="xl" />
                </span>
              </div>
            )}

            {person.match_score !== null && (
              <MatchScoreBadge score={person.match_score} size="sm" count className="absolute left-3 top-3 border-0 bg-white/95 shadow-soft backdrop-blur" />
            )}
            {person.is_verified && (
              <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#627D70] shadow-soft backdrop-blur" title="Perfil verificado">
                <VerifiedIcon className="h-4 w-4" />
                <span className="sr-only">Perfil verificado</span>
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-4">
            <p className="truncate text-base font-bold tracking-[-0.02em] text-brand-dark">
              {fullName || "Persona de CoFlow"}
              {person.age !== null && <span className="font-semibold text-secondary">, {person.age}</span>}
            </p>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-secondary"><LocationPinIcon />{location}</p>

            {habitChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {habitChips.map((chip) => <TraitChip key={chip}>{chip}</TraitChip>)}
              </div>
            )}
          </div>
        </motion.article>
      </ViewTransition>
    </Link>
  );
}

function ExploreCommunityCard({ item, index, isOwn }: { item: Community; index: number; isOwn: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const visibleMembers = item.members.slice(0, 4);
  const scores = item.average_compatibility?.categories.map((category) => category.score) ?? [];
  const affinity = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  const location = item.neighborhood ? `${item.neighborhood}, ${item.city}` : item.city;
  const lifestyleChips = [
    item.preferences?.atmosphere,
    item.preferences?.lifestyle,
    item.preferences?.cleanliness,
  ].filter((value, chipIndex, all): value is string => Boolean(value) && all.indexOf(value) === chipIndex).slice(0, 3);

  return (
    <Link
      href={`/comunidades/${item.id}`}
      transitionTypes={["nav-forward"]}
      style={{ "--i": index + 4 } as CSSProperties}
      className="stagger-in group block w-72 shrink-0 snap-start rounded-24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#627D70] sm:w-76"
    >
      <ViewTransition name={detailTransitionName("community", item.id)} share="coflow-detail-morph">
        <motion.article
          whileHover={prefersReducedMotion ? undefined : { y: -4 }}
          whileTap={{ scale: 0.975 }}
          transition={{ duration: MOTION_DURATION.fast }}
          className="explore-card flex h-full min-h-80 flex-col overflow-hidden rounded-24 border border-black/[0.065] bg-white shadow-[0_10px_30px_rgba(42,62,53,0.07)] transition-shadow duration-200 group-hover:shadow-[0_18px_44px_rgba(42,62,53,0.13)]"
        >
          <div className="relative flex min-h-32 items-center justify-center overflow-hidden border-b border-[#627D70]/10 bg-linear-to-br from-[#f3f7f5] via-white to-[#e7efeb] px-5 py-6">
            <span className="absolute -left-10 -top-12 h-28 w-28 rounded-full border-[18px] border-[#627D70]/5" aria-hidden="true" />
            <span className="absolute -bottom-12 -right-8 h-28 w-28 rounded-full bg-[#627D70]/5" aria-hidden="true" />
            <div className="relative flex items-center justify-center -space-x-3 transition-transform duration-300 group-hover:scale-[1.035] motion-reduce:transform-none">
              {visibleMembers.length > 0 ? visibleMembers.map((member) => (
                <UserAvatar
                  key={member.id}
                  firstName={member.user.first_name}
                  lastName={member.user.last_name}
                  userId={member.user.id}
                  imageUrl={member.user.avatar_url}
                  size="lg"
                  className="border-[3px] border-white shadow-soft"
                />
              )) : (
                <UserAvatar firstName={item.name} userId={String(item.id)} size="lg" className="border-[3px] border-white shadow-soft" />
              )}
            </div>
            {isOwn && <span className="absolute left-3 top-3 rounded-full bg-[#627D70] px-2.5 py-1 text-3xs font-bold text-white shadow-soft">Tu comunidad</span>}
          </div>

          <div className="flex flex-1 flex-col p-4">
            <h3 className="truncate font-rounded text-lg font-semibold tracking-[-0.025em] text-brand-dark">{item.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-secondary"><LocationPinIcon />{location}</p>
            <p className="mt-1 text-xs text-muted">{item.member_count} {item.member_count === 1 ? "miembro" : "miembros"}</p>

            <dl className="mt-4 grid grid-cols-3 gap-1.5">
              <CommunityStat label="Precio" value={item.monthly_rent !== null ? `${item.monthly_rent.toLocaleString("es-ES")} €` : "—"} />
              <CommunityStat label="Plazas" value={String(item.open_spots)} />
              <CommunityStat label="Afinidad" value={affinity !== null ? `${affinity}%` : "—"} />
            </dl>

            {lifestyleChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {lifestyleChips.map((chip) => <TraitChip key={chip}>{chip}</TraitChip>)}
              </div>
            )}
          </div>
        </motion.article>
      </ViewTransition>
    </Link>
  );
}

function CommunityStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-14 bg-[#f5f8f6] px-2 py-2.5 text-center">
      <dt className="text-3xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="mt-1 truncate text-xs font-bold text-primary-dark">{value}</dd>
    </div>
  );
}

function TraitChip({ children }: { children: React.ReactNode }) {
  return <span className="max-w-full truncate rounded-full bg-[#eaf0ec] px-2.5 py-1.5 text-3xs font-semibold text-brand-mid">{children}</span>;
}

function SparkleIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true"><path d="m12 3 1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" /></svg>;
}

function FilterIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true"><path d="M4 7h10" /><path d="M18 7h2" /><path d="M4 17h2" /><path d="M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>;
}

function LocationPinIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
}

function VerifiedIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true"><path d="M12 2 9.5 4.5 6 4l-.5 3.5L2 9l2 3-2 3 3.5 1.5L6 20l3.5-.5L12 22l2.5-2.5L18 20l.5-3.5L22 15l-2-3 2-3-3.5-1.5L18 4l-3.5.5Z" /><path d="m8.5 12.3 2.2 2.2 4.3-4.8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>;
}

function ChevronIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;
}

function ChevronDownIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
