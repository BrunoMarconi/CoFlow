"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, Search, Sparkles } from "lucide-react";
import type { CoFlowMode } from "@/providers/OwnerModeProvider";

const DURATION = 1180;

export default function OwnerModeTransition({ target, onComplete }: { target: CoFlowMode; onComplete: () => void }) {
  const reduced = useReducedMotion();
  const owner = target === "owner";

  useEffect(() => {
    const id = window.setTimeout(onComplete, reduced ? 160 : DURATION);
    return () => window.clearTimeout(id);
  }, [onComplete, reduced]);

  return (
    <motion.div aria-live="polite" className="fixed inset-0 z-100 overflow-hidden bg-black text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0.08 : 0.2 }}>
      <motion.div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(255,255,255,0.16),transparent_36%)]" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} transition={{ duration: reduced ? 0.1 : 1.05, ease: [0.22, 1, 0.36, 1] }} />
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <div className="relative flex h-28 w-28 items-center justify-center">
          <motion.span className="absolute inset-0 rounded-full border border-white/20" initial={{ scale: 0.55, opacity: 0 }} animate={{ scale: [0.55, 1, 1.45], opacity: [0, 0.9, 0] }} transition={{ duration: reduced ? 0.1 : 0.95, ease: "easeOut" }} />
          <motion.div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-[0_22px_60px_rgba(0,0,0,0.38)]" initial={{ scale: 0.6, rotate: owner ? -18 : 18 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 16, stiffness: 190 }}>
            {owner ? <Building2 className="h-9 w-9" strokeWidth={1.7} /> : <Search className="h-9 w-9" strokeWidth={1.7} />}
          </motion.div>
        </div>
        <motion.p className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/62" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.22 }}><Sparkles className="h-4 w-4" />Cambiando de perspectiva</motion.p>
        <motion.h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.055em] sm:text-6xl" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduced ? 0 : 0.3, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}>{owner ? "Tus pisos, en primer plano" : "Vuelves a buscar hogar"}</motion.h2>
        <motion.p className="mt-4 max-w-sm text-sm leading-6 text-white/65 sm:text-base" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 0.46 }}>{owner ? "Abriendo tu espacio de propietario" : "Recuperando personas, comunidades y tus favoritos"}</motion.p>
        <motion.span className="mt-9 h-0.5 w-36 origin-left rounded-full bg-white" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduced ? 0.1 : 0.72, delay: reduced ? 0 : 0.3, ease: "easeInOut" }} />
      </div>
    </motion.div>
  );
}
