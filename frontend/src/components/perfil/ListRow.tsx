"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";

/** Fila de lista agrupada (Cuenta/Soporte). Sin `href`, la fila queda
 * inerte (sin ruta real todavía) — se muestra atenuada, sin chevron
 * interactivo ni feedback de tap, para no simular una acción que no
 * existe. */
export default function ListRow({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-12 ${
          href ? "bg-mint-50 text-primary" : "bg-surface-muted text-muted"
        }`}
      >
        {icon}
      </span>

      <span
        className={`min-w-0 flex-1 text-sm font-semibold ${
          href ? "text-foreground" : "text-muted"
        }`}
      >
        {label}
      </span>

      <ChevronIcon
        className={`h-4.5 w-4.5 shrink-0 ${href ? "text-muted" : "text-border"}`}
      />
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      <motion.div whileTap={{ scale: MOTION_HOME_TAP_SCALE }}>
        {content}
      </motion.div>
    </Link>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
