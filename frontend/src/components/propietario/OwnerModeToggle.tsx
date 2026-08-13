"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useOwnerMode } from "@/hooks/useOwnerMode";

export default function OwnerModeToggle() {
  const { hasPublishedProperties, propertiesLoading, requestModeSwitch } = useOwnerMode();
  if (propertiesLoading || !hasPublishedProperties) return null;

  return (
    <motion.button
      type="button"
      onClick={() => requestModeSwitch("owner")}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] left-5 right-5 z-30 mx-auto flex h-14 max-w-lg items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)] transition hover:bg-[#282828] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black sm:bottom-7 sm:left-auto sm:right-8 md:right-10"
      aria-label="Gestionar mis pisos"
    >
      <Building2 className="h-5 w-5" />
      Gestionar mis pisos
    </motion.button>
  );
}
