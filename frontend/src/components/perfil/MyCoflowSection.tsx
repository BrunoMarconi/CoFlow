"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AvatarGroup from "@/components/ui/AvatarGroup";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";
import type { Community } from "@/types/community";

export default function MyCoflowSection({
  community,
  savedCount,
  connectionsCount,
  pendingReceivedCount,
}: {
  community: Community | null;
  savedCount: number;
  connectionsCount: number;
  pendingReceivedCount: number;
}) {
  return (
    <div className="space-y-3">
      <CommunityCard community={community} />

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          href="/conexiones"
          value={connectionsCount}
          label="conexiones"
          cta="Ver todas"
        />

        <StatCard
          href="/personas/guardadas"
          value={savedCount}
          label="guardados"
          cta="Ver todos"
        />

        <StatCard
          href="/conexiones"
          value={pendingReceivedCount}
          label="solicitudes"
          cta="Ver todas"
          badge={pendingReceivedCount > 0 ? "Pendientes" : undefined}
        />
      </div>
    </div>
  );
}

function CommunityCard({ community }: { community: Community | null }) {
  if (!community) {
    return (
      <Link
        href="/comunidades"
        className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <motion.div
          whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
          className="flex items-center gap-3 rounded-18 border border-border bg-surface p-4 transition-colors duration-180 hover:bg-surface-soft sm:p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">
            <HomeIcon />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-dark">Mi comunidad</p>
            <p className="mt-0.5 text-xs text-muted">
              Todavía no tienes comunidad — explora y únete a una
            </p>
          </div>

          <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
        </motion.div>
      </Link>
    );
  }

  const members = community.members.map((member) => ({
    id: String(member.id),
    firstName: member.user.first_name,
    lastName: member.user.last_name,
    imageUrl: member.user.avatar_url,
  }));

  return (
    <Link
      href="/mi-comunidad"
      className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
        className="flex items-center gap-3 rounded-18 border border-border bg-surface p-4 transition-colors duration-180 hover:bg-surface-soft sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">
          <HomeIcon />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-dark">Mi comunidad</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-secondary">
            {community.name}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {community.member_count}{" "}
            {community.member_count === 1 ? "miembro" : "miembros"}
          </p>
        </div>

        {members.length > 0 && (
          <AvatarGroup
            members={members}
            totalCount={community.member_count}
            className="shrink-0"
          />
        )}

        <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
      </motion.div>
    </Link>
  );
}

function StatCard({
  href,
  value,
  label,
  cta,
  badge,
}: {
  href: string;
  value: number;
  label: string;
  cta: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
        className="flex h-full flex-col gap-1 rounded-18 border border-border bg-surface p-3.5 transition-colors duration-180 hover:bg-surface-soft"
      >
        {badge && (
          <span className="mb-1 inline-flex w-max items-center rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-primary-dark">
            {badge}
          </span>
        )}

        <p className="text-2xl font-bold text-brand-dark">{value}</p>
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="mt-1 text-[11px] font-bold text-primary-dark">{cta}</p>
      </motion.div>
    </Link>
  );
}

function HomeIcon() {
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
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10" />
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
