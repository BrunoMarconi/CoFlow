"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE, MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";
import type { User } from "@/types/auth";

export default function TrustSection({ user }: { user: User }) {
  const emailVerified = user.is_email_verified;

  return (
    <div className="grid grid-cols-1 gap-3">
      <EmailCard verified={emailVerified} email={user.email} />
    </div>
  );
}

function EmailCard({ verified, email }: { verified: boolean; email: string }) {
  const content = (
    <motion.div
      whileTap={verified ? undefined : { scale: MOTION_HOME_TAP_SCALE }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      className="h-full rounded-18 border border-border/60 bg-surface p-4 transition-colors duration-180 hover:border-primary/25"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-surface text-primary">
          <MailIcon />
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            verified
              ? "bg-primary text-white"
              : "bg-flat text-muted"
          }`}
        >
          {verified ? "Verificado" : "Pendiente"}
        </span>
      </div>

      <p className="mt-3 text-sm font-bold text-brand-dark">Email verificado</p>
      <p className="mt-1 truncate text-xs leading-5 text-muted">{email}</p>

      {!verified && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-dark">
          Verificar ahora
          <ChevronIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </motion.div>
  );

  if (verified) return content;

  return (
    <Link
      href="/verificacion-pendiente"
      className="block h-full rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {content}
    </Link>
  );
}

function MailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
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
