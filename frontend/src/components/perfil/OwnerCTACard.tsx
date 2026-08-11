"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";

export default function OwnerCTACard({ isOwner }: { isOwner: boolean }) {
  return (
    <Link
      href={isOwner ? "/propietarios" : "/propietarios/perfil"}
      className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
        className="flex items-center gap-3.5 rounded-18 border border-border bg-surface p-4 shadow-soft transition duration-180 hover:border-primary/25 sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
          <KeyIcon />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-dark">
            {isOwner ? "Tu espacio de propietario" : "¿Tienes una vivienda?"}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-primary-dark">
            {isOwner
              ? "Gestiona tus viviendas publicadas en CoFlow."
              : "Crea tu perfil de propietario y gestiona tus viviendas desde CoFlow."}
          </p>
        </div>

        <ChevronIcon className="h-5 w-5 shrink-0 text-primary-dark" />
      </motion.div>
    </Link>
  );
}

function KeyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.5-8.5" />
      <path d="m16.5 6 2.5 2.5" />
      <path d="m14 8.5 2.5 2.5" />
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
