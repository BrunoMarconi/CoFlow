"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CoFlowMode } from "@/providers/OwnerModeProvider";

const VIDEO_FALLBACK_MS = 2600;
const REDUCED_DURATION_MS = 220;

const COPY = {
  owner: { title: "Gestionar mis pisos" },
  member: { title: "Volver a buscar hogar" },
} satisfies Record<CoFlowMode, { title: string }>;

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
  const poster =
    target === "owner"
      ? "/images/mode-switch-interior-avatar-2026.png"
      : "/images/mode-switch-exterior-avatar-2026.png";

  useEffect(() => {
    completedRef.current = false;
    const id = window.setTimeout(
      () => {
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete();
      },
      reduced ? REDUCED_DURATION_MS : VIDEO_FALLBACK_MS
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
      aria-label={copy.title}
      className="fixed inset-0 z-100 overflow-hidden bg-[#f7f7f5]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.08 : 0.16 }}
    >
      {reduced ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${poster})` }}
        />
      ) : (
        <video
          key={target}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={poster}
          onEnded={completeFromVideo}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        >
          <source src={`/videos/mode-${target}.webm`} type="video/webm" />
          <source src={`/videos/mode-${target}.mp4`} type="video/mp4" />
        </video>
      )}
    </motion.div>
  );
}
