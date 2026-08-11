"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";

export default function ViewPublicProfileRow({ userId }: { userId: string }) {
  return (
    <Link
      href={`/personas/${userId}`}
      className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
        className="flex items-center gap-3 rounded-18 border border-border bg-surface p-4 transition-colors duration-180 hover:bg-surface-soft sm:p-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-mint-50 text-primary">
          <EyeIcon />
        </span>

        <span className="min-w-0 flex-1 text-sm font-bold text-brand-dark">
          Ver perfil público
        </span>

        <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
      </motion.div>
    </Link>
  );
}

function EyeIcon() {
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
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
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
