"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AvatarUploader from "@/components/perfil/AvatarUploader";
import UserAvatar from "@/components/ui/UserAvatar";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";
import type { User } from "@/types/auth";

export default function IdentityHeader({
  user,
  cityLabel,
  onAvatarUpdated,
}: {
  user: User;
  cityLabel?: string | null;
  onAvatarUpdated: () => Promise<void>;
}) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();

  const metaLine = [
    cityLabel,
    user.age !== null ? `${user.age} años` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/personas/${user.id}`}
      aria-label={`Ver perfil público de ${fullName || "tu perfil"}`}
      className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
        className="flex items-center gap-4"
      >
        <div className="relative h-16 w-16 shrink-0">
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            userId={user.id}
            imageUrl={user.avatar_url}
            size="lg"
          />

          <AvatarUploader
            hasAvatar={Boolean(user.avatar_url)}
            onUpdated={onAvatarUpdated}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="truncate text-[22px] font-bold tracking-tight text-brand-dark">
              {fullName || "Persona de CoFlow"}
            </h1>

            {user.is_email_verified && (
              <VerifiedIcon className="h-4.5 w-4.5 shrink-0 text-primary" />
            )}
          </div>

          {metaLine && (
            <p className="mt-0.5 truncate text-sm font-semibold text-secondary">
              {metaLine}
            </p>
          )}
        </div>

        <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
      </motion.div>
    </Link>
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
