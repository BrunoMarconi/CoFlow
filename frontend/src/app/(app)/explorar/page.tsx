"use client";

import { useState } from "react";
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
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
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

/* Ligero desfase en abanico para los avatares del hero — puramente
 * decorativo, cubre hasta 3 posiciones. */
const HERO_AVATAR_OFFSETS = [
  "left-0 top-3 rotate-[-6deg]",
  "left-9 top-0 rotate-[4deg]",
  "left-18 top-4 rotate-[-3deg]",
];

export default function ExplorarPage() {
  const router = useRouter();
  const { user, loading, community } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const [segment, setSegment] = useState<Segment>("all");

  const { users, loading: usersLoading } = useUsers();
  const { communities, loading: communitiesLoading } = useCommunities();

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
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
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <ExplorerSearchBar
        layoutIdBar="explorar-search-bar"
        layoutIdIcon="explorar-search-icon"
        searchOpen={false}
        onOpen={handleSearchOpen}
        onBack={() => {}}
        value=""
        onChange={() => {}}
        onClear={() => {}}
        collapsedPlaceholder="Buscar personas o comunidades"
        placeholder=""
      />

      <div
        role="tablist"
        aria-label="Tipo de contenido a explorar"
        className="flex gap-2"
      >
        <SegmentPill active={segment === "all"} onClick={() => setSegment("all")}>
          Todo
        </SegmentPill>

        <SegmentPill
          active={segment === "people"}
          onClick={() => setSegment("people")}
        >
          Personas
        </SegmentPill>

        <SegmentPill
          active={segment === "communities"}
          onClick={() => setSegment("communities")}
        >
          Comunidades
        </SegmentPill>
      </div>

      <section className="flex items-center justify-between gap-4 rounded-24 border border-border bg-surface p-5 sm:p-6">
        <div className="min-w-0">
          <p className="font-rounded text-xl font-semibold leading-snug text-brand-dark">
            Encuentra a tu gente
          </p>

          <p className="mt-1.5 max-w-[30ch] text-[13px] leading-5 text-secondary">
            Descubre personas y comunidades con las que compartir tu
            próxima etapa.
          </p>

          <Link
            href="/usuarios"
            className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary-dark transition hover:text-brand-dark"
          >
            Explorar personas
            <ChevronIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        {heroPeople.length > 0 && (
          <div className="relative h-20 w-28 shrink-0 sm:h-24 sm:w-32">
            {heroPeople.map((person, index) => (
              <div
                key={person.id}
                style={{ zIndex: heroPeople.length - index }}
                className={cn(
                  "absolute overflow-hidden rounded-full border-2 border-surface shadow-soft",
                  HERO_AVATAR_OFFSETS[index]
                )}
              >
                <UserAvatar
                  firstName={person.first_name}
                  lastName={person.last_name}
                  userId={person.id}
                  imageUrl={person.avatar_url}
                  size={isDesktop ? "xl" : "lg"}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={segment}
          initial={contentInitial}
          animate={{ opacity: 1, y: 0 }}
          exit={contentExit}
          transition={{ duration, ease: MOTION_EASE.out }}
          className="space-y-7"
        >
          {segment !== "communities" && (
            <DiscoveryRow
              title="Personas para conocer"
              viewAllHref="/usuarios"
              loading={usersLoading}
              isEmpty={users.length === 0}
              emptyMessage="Todavía no hay personas para mostrar."
              skeletonWidth="w-56"
              skeletonHeight="h-64"
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
              title="Comunidades para explorar"
              viewAllHref="/comunidades"
              loading={communitiesLoading}
              isEmpty={communities.length === 0}
              emptyMessage="Todavía no hay comunidades para mostrar."
              skeletonWidth="w-68"
              skeletonHeight="h-56"
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

      <Link
        href={ctaHref}
        className="block rounded-14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <motion.div
          whileTap={{ scale: 0.985 }}
          className="flex items-center gap-3 rounded-14 border border-border bg-surface p-3 transition-colors duration-180 hover:bg-surface-soft"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-12 bg-mint-50 text-primary">
            <SparkleIcon />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-dark">{ctaTitle}</p>
            <p className="truncate text-xs text-muted">{ctaDescription}</p>
          </div>

          <ChevronIcon className="h-4 w-4 shrink-0 text-muted" />
        </motion.div>
      </Link>
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
      className={cn(
        "h-10 shrink-0 rounded-full border px-3.5 text-sm font-bold transition-colors duration-150",
        active
          ? "border-primary/25 bg-mint-50 text-primary-dark"
          : "border-border bg-surface text-secondary hover:bg-surface-soft"
      )}
    >
      {children}
    </button>
  );
}

function DiscoveryRow({
  title,
  viewAllHref,
  loading,
  isEmpty,
  emptyMessage,
  skeletonWidth,
  skeletonHeight,
  children,
}: {
  title: string;
  viewAllHref: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonWidth: string;
  skeletonHeight: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-rounded text-[21px] font-semibold text-brand-dark">
          {title}
        </h2>

        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-bold text-primary-dark transition hover:text-brand-dark"
        >
          Ver todas
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
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
      ) : isEmpty ? (
        <EmptyState title={emptyMessage} />
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {children}
          <div aria-hidden="true" className="w-1 shrink-0" />
        </div>
      )}
    </div>
  );
}

/** Preview compacto para el Home — no es la ficha de búsqueda
 * profunda (esa vive en /usuarios vía UserCard). Solo foto/avatar,
 * nombre y un único dato de contexto real. */
function ExplorePersonCard({ person }: { person: UserPublicProfile }) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();
  const hasPhoto = Boolean(person.avatar_url);

  const subtitle = person.community
    ? person.community.city
    : person.is_owner
      ? "Propietario"
      : "Busca comunidad";

  return (
    <Link
      href={`/personas/${person.id}`}
      className="block w-56 shrink-0 rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="overflow-hidden rounded-18 border border-border bg-surface"
      >
        <div className="relative h-48 bg-surface-muted">
          {hasPhoto ? (
            <Image
              src={person.avatar_url!}
              alt=""
              fill
              unoptimized
              sizes="224px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="rounded-full ring-4 ring-border/50">
                <UserAvatar
                  firstName={person.first_name}
                  lastName={person.last_name}
                  userId={person.id}
                  size="lg"
                />
              </div>
            </div>
          )}

          {person.is_verified && (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-primary shadow-soft">
              <VerifiedIcon className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="p-2.5">
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
      className="block w-68 shrink-0 rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ duration: MOTION_DURATION.fast }}
        className="overflow-hidden rounded-18 border border-border bg-surface"
      >
        <div className="relative h-30 bg-surface-muted">
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
              <span className="shrink-0 rounded-full bg-mint-50 px-1.5 py-0.5 text-[10px] font-bold text-primary-dark">
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
