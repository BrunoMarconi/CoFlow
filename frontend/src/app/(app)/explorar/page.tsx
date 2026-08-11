"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useCommunities } from "@/hooks/useCommunities";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ExplorerSearchBar from "@/components/explorer/ExplorerSearchBar";
import SoftButton from "@/components/ui/SoftButton";
import SectionHeader from "@/components/ui/SectionHeader";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import UserCard from "@/components/usuario/UserCard";
import CommunityCard from "@/components/comunidad/CommunityCard";
import {
  MOTION_EASE,
  MOTION_EXPLORER_NAV_DISTANCE_DESKTOP,
  MOTION_EXPLORER_NAV_DISTANCE_MOBILE,
  MOTION_EXPLORER_NAV_DURATION_DESKTOP,
  MOTION_EXPLORER_NAV_DURATION_MOBILE,
} from "@/lib/motionTokens";

type Segment = "all" | "people" | "communities";

const PREVIEW_COUNT_MIXED = 6;
const PREVIEW_COUNT_FOCUSED = 10;

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

  const heroTitle = community
    ? `Descubre más gente cerca de ${community.city}`
    : `${user.first_name}, encuentra tu próxima comunidad`;

  const ctaHref = community ? "/perfil" : "/crear/comunidad";
  const ctaTitle = community ? "Completa tu perfil" : "Crea tu comunidad";
  const ctaDescription = community
    ? "Un perfil completo genera más confianza entre quienes lo ven."
    : "Empieza tu propio espacio en CoFlow e invita a tu gente.";

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
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-4">
      <ExplorerSearchBar
        layoutIdBar="explorar-search-bar"
        layoutIdIcon="explorar-search-icon"
        searchOpen={false}
        onOpen={handleSearchOpen}
        onBack={() => {}}
        value=""
        onChange={() => {}}
        onClear={() => {}}
        collapsedPlaceholder={
          segment === "communities"
            ? "Buscar comunidades..."
            : "Buscar personas..."
        }
        placeholder=""
      />

      <div
        role="tablist"
        aria-label="Tipo de contenido a explorar"
        className="flex gap-2"
      >
        <SoftButton
          role="tab"
          aria-selected={segment === "all"}
          active={segment === "all"}
          onClick={() => setSegment("all")}
        >
          Todo
        </SoftButton>

        <SoftButton
          role="tab"
          aria-selected={segment === "people"}
          active={segment === "people"}
          onClick={() => setSegment("people")}
        >
          Personas
        </SoftButton>

        <SoftButton
          role="tab"
          aria-selected={segment === "communities"}
          active={segment === "communities"}
          onClick={() => setSegment("communities")}
        >
          Comunidades
        </SoftButton>
      </div>

      <section className="relative overflow-hidden rounded-24 border border-primary/10 bg-mint-50 p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />

        <p className="max-w-md font-rounded text-xl font-semibold leading-snug text-brand-dark sm:text-2xl">
          {heroTitle}
        </p>

        <p className="mt-2 max-w-md text-sm leading-6 text-secondary">
          Explora personas y comunidades reales de CoFlow y da el
          siguiente paso cuando encuentres tu sitio.
        </p>

        <Link
          href="/usuarios"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-14 bg-primary px-5 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          Empieza a explorar
        </Link>
      </section>

      <Link
        href={ctaHref}
        className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <motion.div
          whileTap={{ scale: 0.985 }}
          className="flex items-center gap-3.5 rounded-18 border border-border bg-surface p-4 transition-colors duration-180 hover:bg-surface-soft sm:p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-14 bg-mint-50 text-primary">
            <SparkleIcon />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-dark">{ctaTitle}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {ctaDescription}
            </p>
          </div>

          <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
        </motion.div>
      </Link>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={segment}
          initial={contentInitial}
          animate={{ opacity: 1, y: 0 }}
          exit={contentExit}
          transition={{ duration, ease: MOTION_EASE.out }}
          className="space-y-8"
        >
          {segment !== "communities" && (
            <DiscoveryRow
              title="Personas para conocer"
              viewAllHref="/usuarios"
              loading={usersLoading}
              isEmpty={users.length === 0}
              emptyMessage="Todavía no hay personas para mostrar."
            >
              {users
                .slice(
                  0,
                  segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED
                )
                .map((person) => (
                  <div key={person.id} className="w-72 shrink-0 sm:w-80">
                    <UserCard
                      user={person}
                      onOpen={(id) => router.push(`/personas/${id}`)}
                    />
                  </div>
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
            >
              {communities
                .slice(
                  0,
                  segment === "all" ? PREVIEW_COUNT_MIXED : PREVIEW_COUNT_FOCUSED
                )
                .map((item) => (
                  <div key={item.id} className="w-72 shrink-0 sm:w-80">
                    <CommunityCard
                      community={item}
                      isOwn={item.id === community?.id}
                    />
                  </div>
                ))}
            </DiscoveryRow>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DiscoveryRow({
  title,
  viewAllHref,
  loading,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  viewAllHref: string;
  loading: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SectionHeader
        title={title}
        action={
          <Link
            href={viewAllHref}
            className="text-xs font-bold text-primary-dark transition hover:text-brand-dark"
          >
            Ver todas
          </Link>
        }
        className="mb-4"
      />

      {loading ? (
        <div className="scroll-fade-x flex gap-4 overflow-x-auto pb-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-72 shrink-0 sm:w-80">
              <SkeletonCard withCover coverClassName="h-36 sm:h-40" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState title={emptyMessage} />
      ) : (
        <div className="scroll-fade-x flex gap-4 overflow-x-auto pb-1 snap-x snap-proximity">
          {children}
        </div>
      )}
    </div>
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
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m12 3 1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
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
