"use client";

import { motion } from "framer-motion";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { HomeIcon, KeyIcon } from "@/components/layout/NavIcons";

export default function OwnerModeToggle() {
  const {
    isOwnerMode,
    hasPublishedProperties,
    propertiesLoading,
    requestModeSwitch,
  } = useOwnerMode();

  if (propertiesLoading || !hasPublishedProperties) return null;

  const target = isOwnerMode ? "member" : "owner";
  const Icon = isOwnerMode ? HomeIcon : KeyIcon;

  return (
    <motion.button
      type="button"
      onClick={() => requestModeSwitch(target)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+1rem)] right-5 z-30 flex items-center gap-3 rounded-full border border-primary/25 bg-surface py-2.5 pl-3 pr-4 text-left shadow-[0_14px_32px_rgba(26,55,43,0.14)] transition focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary sm:bottom-8 sm:right-8 md:right-10"
      aria-label={isOwnerMode ? "Cambiar a modo persona" : "Cambiar a propietario"}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-brand-dark">
          {isOwnerMode ? "Cambiar a modo persona" : "Cambiar a propietario"}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {isOwnerMode ? "Descubrir CoFlow" : "Gestionar mis pisos"}
        </span>
      </span>
    </motion.button>
  );
}
