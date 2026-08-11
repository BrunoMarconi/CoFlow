"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";
import type { User } from "@/types/auth";
import type { OnboardingAnswers } from "@/types/onboarding";

export default function YourProfileSection({
  user,
  answers,
  cityLabel,
}: {
  user: User;
  answers: Partial<OnboardingAnswers>;
  cityLabel: string | null;
}) {
  const budgetLabel =
    user.rental_budget !== null
      ? `${user.rental_budget.toLocaleString("es-ES")} €/mes`
      : null;

  const personalInfoSubtitle =
    [
      user.age !== null ? `${user.age} años` : null,
      cityLabel,
      user.occupation,
    ]
      .filter(Boolean)
      .join(" · ") || "Añade tus datos personales";

  const housingPrefsSubtitle = [
    budgetLabel ? `Hasta ${budgetLabel}` : "Presupuesto sin definir",
    user.is_looking_for_roommates ? "Buscando compañeros" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const habitsSubtitle =
    answeredCount > 0
      ? `${answeredCount} hábitos completados`
      : "Completa el cuestionario de convivencia";

  const sortedPhotos = [...user.photos].sort((a, b) => a.position - b.position);

  const workBudgetSubtitle =
    [user.occupation, budgetLabel].filter(Boolean).join(" · ") ||
    "Añade tu trabajo y presupuesto";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          href="/perfil/editar"
          icon={<UserIcon />}
          title="Información personal"
          subtitle={personalInfoSubtitle}
        />

        <SummaryCard
          href="/perfil/preferencias"
          icon={<HomeIcon />}
          title="Preferencias de vivienda"
          subtitle={housingPrefsSubtitle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard
          href={answeredCount > 0 ? "/onboarding?edit=true" : "/onboarding"}
          icon={<HabitsIcon />}
          title="Hábitos y estilo de vida"
          subtitle={habitsSubtitle}
        />

        <Link
          href="#fotos"
          className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <motion.div
            whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
            className="flex h-full flex-col gap-3 rounded-18 border border-border bg-surface p-4 transition-colors duration-180 hover:bg-surface-soft"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">
              <PhotosIcon />
            </span>

            <div>
              <p className="text-sm font-bold text-brand-dark">Fotos</p>

              {sortedPhotos.length > 0 ? (
                <div className="mt-2 flex gap-1.5">
                  {sortedPhotos.slice(0, 3).map((photo) => (
                    <div
                      key={photo.id}
                      className="relative h-10 w-10 shrink-0 overflow-hidden rounded-10 bg-surface-muted"
                    >
                      <Image
                        src={photo.image_url}
                        alt=""
                        fill
                        unoptimized
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs leading-5 text-muted">
                  Todavía no has añadido fotos
                </p>
              )}
            </div>
          </motion.div>
        </Link>
      </div>

      <SummaryCard
        href="/perfil/editar"
        icon={<BriefcaseIcon />}
        title="Trabajo y presupuesto"
        subtitle={workBudgetSubtitle}
        wide
      />
    </div>
  );
}

function SummaryCard({
  href,
  icon,
  title,
  subtitle,
  wide = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  wide?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block rounded-18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div
        whileTap={{ scale: MOTION_HOME_TAP_SCALE }}
        className={`flex rounded-18 border border-border bg-surface p-4 transition-colors duration-180 hover:bg-surface-soft ${
          wide ? "items-center gap-3.5" : "h-full flex-col gap-3"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-dark">{title}</p>
          <p className="mt-1 truncate text-xs leading-5 text-muted">
            {subtitle}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10" />
    </svg>
  );
}

function HabitsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
    </svg>
  );
}

function PhotosIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
