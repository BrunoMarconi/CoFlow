"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getMySolvencyPassport } from "@/services/solvencyPassports";
import { MOTION_DURATION, MOTION_EASE, MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";
import { SOLVENCY_PASSPORT_ENABLED } from "@/lib/featureFlags";
import type { SolvencyPassport } from "@/types/solvencyPassport";
import type { User } from "@/types/auth";

export default function TrustSection({ user }: { user: User }) {
  const [passport, setPassport] = useState<SolvencyPassport | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(SOLVENCY_PASSPORT_ENABLED);

  useEffect(() => {
    if (!SOLVENCY_PASSPORT_ENABLED) return;

    let active = true;

    getMySolvencyPassport()
      .then((data) => {
        if (active) setPassport(data);
      })
      .catch(() => {
        if (active) setPassport(null);
      })
      .finally(() => {
        if (active) setLoadingPassport(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const solvencyVerified = passport?.status === "ISSUED";
  const emailVerified = user.is_email_verified;

  return (
    <div className="grid grid-cols-2 gap-3">
      <PassportCard verified={solvencyVerified} loading={loadingPassport} />
      <EmailCard verified={emailVerified} email={user.email} />
    </div>
  );
}

function PassportCard({
  verified,
  loading,
}: {
  verified: boolean;
  loading: boolean;
}) {
  if (!SOLVENCY_PASSPORT_ENABLED) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
        className="rounded-18 border border-border bg-surface p-4 opacity-70"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
            <PassportIcon />
          </span>
          <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-muted">
            Próximamente
          </span>
        </div>

        <p className="mt-3 text-sm font-bold text-brand-dark">
          Pasaporte de solvencia
        </p>

        <p className="mt-1 text-xs leading-5 text-muted">
          Estamos preparando esta función.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      className={`rounded-18 border p-4 ${
        verified
          ? "border-primary/25 bg-surface shadow-soft"
          : "border-border bg-surface shadow-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
          <PassportIcon />
        </span>

        {!loading && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              verified
                ? "bg-primary text-white"
                : "bg-surface-soft text-muted"
            }`}
          >
            {verified ? "Activo" : "Sin emitir"}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-bold text-brand-dark">
        Pasaporte de solvencia
      </p>

      <p className="mt-1 text-xs leading-5 text-muted">
        {verified
          ? "Tu pasaporte está activo y disponible para propietarios."
          : "Conecta tu banco para emitirlo."}
      </p>

      <Link
        href="/pasaporte"
        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary-dark"
      >
        Ver pasaporte
        <ChevronIcon className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}

function EmailCard({ verified, email }: { verified: boolean; email: string }) {
  const content = (
    <motion.div
      whileTap={verified ? undefined : { scale: MOTION_HOME_TAP_SCALE }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      className={`h-full rounded-18 border p-4 transition-colors duration-180 ${
        verified
          ? "border-primary/25 bg-surface shadow-soft"
          : "border-border bg-surface shadow-soft hover:bg-surface-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
          <MailIcon />
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
            verified
              ? "bg-primary text-white"
              : "bg-surface-soft text-muted"
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

function PassportIcon() {
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
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M8 18h8" />
    </svg>
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
