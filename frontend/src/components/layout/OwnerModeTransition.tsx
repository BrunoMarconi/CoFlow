"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CoFlowMode } from "@/providers/OwnerModeProvider";

const VIDEO_DURATION_MS = 2000;
const REDUCED_DURATION_MS = 220;

const COPY = {
  owner: {
    eyebrow: "Perspectiva de propietario",
    title: "Tus pisos, en primer plano",
    detail: "Preparando tu espacio de gestión",
  },
  member: {
    eyebrow: "Perspectiva personal",
    title: "Volvemos a buscar hogar",
    detail: "Recuperando personas y comunidades",
  },
} satisfies Record<CoFlowMode, { eyebrow: string; title: string; detail: string }>;

export default function OwnerModeTransition({
  target,
  onComplete,
}: {
  target: CoFlowMode;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const completedRef = useRef(false);
  const copy = COPY[target];

  useEffect(() => {
    completedRef.current = false;
    const id = window.setTimeout(
      () => {
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete();
      },
      reduced ? REDUCED_DURATION_MS : VIDEO_DURATION_MS
    );
    return () => window.clearTimeout(id);
  }, [onComplete, reduced, target]);

  function completeFromVideo() {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`${copy.title}. ${copy.detail}`}
      className="fixed inset-0 z-100 overflow-hidden bg-[#f7f7f5] text-[#191919]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.08 : 0.16 }}
    >
      {reduced ? (
        <div className="absolute inset-0 bg-[#f7f7f5]" />
      ) : (
        <video
          key={target}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/images/owner-space-modular-2026.png"
          onEnded={completeFromVideo}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src={`/videos/mode-${target}.webm`} type="video/webm" />
          <source src={`/videos/mode-${target}.mp4`} type="video/mp4" />
        </video>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[43%] bg-gradient-to-t from-[#f7f7f5] via-[#f7f7f5]/90 to-transparent" />

      <div className="absolute inset-x-0 bottom-[max(3rem,env(safe-area-inset-bottom))] px-6 text-center sm:bottom-12">
        <motion.p
          className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#717171]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.2, duration: 0.35 }}
        >
          {copy.eyebrow}
        </motion.p>
        <motion.h2
          className="mx-auto mt-3 max-w-2xl text-[clamp(2.15rem,8vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.055em]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 0.28, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          {copy.title}
        </motion.h2>
        <motion.p
          className="mt-4 text-sm font-medium text-[#717171] sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 0.48, duration: 0.35 }}
        >
          {copy.detail}
        </motion.p>
        <div className="mx-auto mt-7 h-px w-40 overflow-hidden bg-black/12">
          <motion.span
            className="block h-full origin-left bg-black"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduced ? 0.15 : 1.65, delay: reduced ? 0 : 0.18, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
