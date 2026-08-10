"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { getTabTransitionTypes } from "@/lib/navTransition";
import { MOTION_SPRING } from "@/lib/motionTokens";

const TABS = [
  { href: "/comunidades", label: "Comunidades" },
  { href: "/usuarios", label: "Personas" },
] as const;

/** Vive en AppShell (fuera de las rutas), así que no se desmonta al
 * navegar entre /comunidades y /usuarios — es lo que permite que el
 * indicador con layoutId se deslice de verdad entre ambas pestañas
 * en vez de simplemente reaparecer. */
export default function ExplorerTabs() {
  const pathname = usePathname();
  const activeHref = TABS.find((tab) => tab.href === pathname)?.href;

  if (!activeHref) return null;

  return (
    <div className="mb-4 inline-flex gap-1 rounded-full border border-border bg-surface p-1 shadow-soft">
      {TABS.map((tab) => {
        const active = tab.href === activeHref;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            transitionTypes={getTabTransitionTypes(pathname, tab.href)}
            className="relative rounded-full px-4 py-2 text-sm font-bold transition-colors duration-200"
          >
            {active && (
              <motion.span
                layoutId="explorer-tab-indicator"
                transition={MOTION_SPRING.snappy}
                className="absolute inset-0 rounded-full bg-mint-100"
              />
            )}

            <span
              className={`relative z-10 ${
                active ? "text-primary-dark" : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
