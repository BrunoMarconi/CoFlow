"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CoFlowMode } from "@/providers/OwnerModeProvider";
import { HomeIcon, KeyIcon } from "@/components/layout/NavIcons";

const OWNER_TRANSITION_DURATION = 820;

export default function OwnerModeTransition({
  target,
  onComplete,
}: {
  target: CoFlowMode;
  onComplete: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isOwner = target === "owner";

  useEffect(() => {
    const timeoutId = window.setTimeout(
      onComplete,
      prefersReducedMotion ? 130 : OWNER_TRANSITION_DURATION
    );

    return () => window.clearTimeout(timeoutId);
  }, [onComplete, prefersReducedMotion]);

  const title = isOwner ? "Modo propietario" : "Modo CoFlow";
  const subtitle = isOwner
    ? "Tus pisos toman el protagonismo"
    : "Volvemos a descubrir personas y comunidades";

  return (
    <motion.div
      aria-live="polite"
      className="fixed inset-0 z-100 flex items-center justify-center bg-background/96 px-6 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.08 : 0.18 }}
    >
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <motion.span
          aria-hidden="true"
          className="absolute h-48 w-48 rounded-full border border-primary/15"
          initial={{ scale: 0.65, opacity: 0 }}
          animate={{ scale: [0.65, 1.15, 1.45], opacity: [0, 0.75, 0] }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.72, ease: "easeOut" }}
        />
        <motion.span
          aria-hidden="true"
          className="absolute h-34 w-34 rounded-full border border-primary/25"
          initial={{ scale: 0.55, opacity: 0 }}
          animate={{ scale: [0.55, 1.1, 1.3], opacity: [0, 0.9, 0] }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.64, delay: 0.08, ease: "easeOut" }}
        />

        <motion.div
          className="relative flex h-22 w-22 items-center justify-center rounded-full border border-primary/25 bg-surface shadow-[0_16px_42px_rgba(26,55,43,0.14)]"
          initial={{ opacity: 0, scale: 0.72, rotate: -16 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.42, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          {isOwner ? (
            <KeyIcon className="h-10 w-10 text-primary" />
          ) : (
            <HomeIcon className="h-10 w-10 text-primary" />
          )}
        </motion.div>

        <motion.h2
          className="mt-7 font-rounded text-3xl font-bold tracking-tight text-brand-dark"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.34, delay: 0.2, ease: "easeOut" }}
        >
          {title}
        </motion.h2>
        <motion.p
          className="mt-2 max-w-64 text-sm leading-6 text-secondary"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.3, delay: 0.28, ease: "easeOut" }}
        >
          {subtitle}
        </motion.p>
      </div>
    </motion.div>
  );
}
