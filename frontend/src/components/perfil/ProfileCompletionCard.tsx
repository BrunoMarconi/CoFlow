"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { celebrate } from "@/components/interaction/Celebration";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type { User } from "@/types/auth";

/** Campos reales que consideramos parte de un perfil completo — cada
 * uno pesa igual. Nada de estimaciones: solo presencia/ausencia de
 * datos que el usuario ya tiene o no tiene. */
function computeCompletion(user: User) {
  const checks = [
    Boolean(user.avatar_url),
    Boolean(user.bio),
    Boolean(user.phone),
    user.age !== null,
    Boolean(user.occupation),
    user.rental_budget !== null,
    user.is_email_verified,
    user.onboarding_completed,
    user.photos.length > 0,
  ];

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

/** Marca de "ya celebrado" en el propio dispositivo: el backend no
 * guarda este hito y sin ella la celebración volvería a salir en cada
 * visita al perfil una vez completado. */
const CELEBRATED_KEY = "coflow:profile-completion-celebrated";

export default function ProfileCompletionCard({ user }: { user: User }) {
  const pct = computeCompletion(user);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (pct < 100) return;

    try {
      if (localStorage.getItem(CELEBRATED_KEY) === user.id) return;
      localStorage.setItem(CELEBRATED_KEY, user.id);
    } catch {
      // Modo privado / almacenamiento bloqueado: preferimos celebrar de
      // más que romper el perfil.
    }

    celebrate.milestone({
      title: "¡Perfil al 100%!",
      message: "Ahora apareces mucho más arriba en las búsquedas.",
      glyph: "✨",
    });
  }, [pct, user.id]);

  return (
    <section className="rounded-18 border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-brand-dark">Perfil completado</p>
        <p className="text-sm font-bold text-primary-dark">{pct}%</p>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <motion.div
          initial={{ width: prefersReducedMotion ? `${pct}%` : 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
          className="h-full rounded-full bg-primary"
        />
      </div>
    </section>
  );
}
