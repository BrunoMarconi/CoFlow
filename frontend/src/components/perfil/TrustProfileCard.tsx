"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySolvencyPassport } from "@/services/solvencyPassports";
import type { SolvencyPassport } from "@/types/solvencyPassport";
import type { User } from "@/types/auth";

export default function TrustProfileCard({ user }: { user: User }) {
  const [passport, setPassport] = useState<SolvencyPassport | null>(null);
  const [loadingPassport, setLoadingPassport] = useState(true);

  useEffect(() => {
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
  const profileVerified = solvencyVerified && emailVerified;

  return (
    <section className="rounded-18 border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-brand-dark">
            Perfil de confianza
          </h2>
        </div>

        {profileVerified && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1.5 text-xs font-bold text-primary-dark">
            <CheckIcon className="h-3.5 w-3.5" />
            Perfil verificado
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <TrustRow
          icon={<PassportIcon className="h-5 w-5" />}
          title="Pasaporte de solvencia"
          verified={solvencyVerified}
          loading={loadingPassport}
          verifiedLabel="Verificado"
          pendingLabel={passport ? "No vigente" : "Sin emitir"}
          description={
            solvencyVerified
              ? "Ingresos verificados y sin morosidad"
              : "Conecta tu banco para emitirlo"
          }
          href="/pasaporte"
        />

        <TrustRow
          icon={<MailIcon className="h-5 w-5" />}
          title="Verificación de email"
          verified={emailVerified}
          loading={false}
          verifiedLabel="Verificado"
          pendingLabel="Pendiente"
          description={
            emailVerified
              ? "Correo electrónico comprobado"
              : "Confirma tu correo para verificarlo"
          }
          href={emailVerified ? undefined : "/verificacion-pendiente"}
        />
      </div>
    </section>
  );
}

function TrustRow({
  icon,
  title,
  verified,
  loading,
  verifiedLabel,
  pendingLabel,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  verified: boolean;
  loading: boolean;
  verifiedLabel: string;
  pendingLabel: string;
  description: string;
  href?: string;
}) {
  const content = (
    <div className="flex h-full flex-col gap-3 rounded-18 border border-border bg-surface-muted p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-14 bg-surface text-primary shadow-soft">
          {icon}
        </span>

        {!loading && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              verified
                ? "bg-mint-100 text-primary-dark"
                : "bg-surface-soft text-muted"
            }`}
          >
            {verified ? verifiedLabel : pendingLabel}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-brand-dark">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function PassportIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="10" r="3" />
      <path d="M8 18h8" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
