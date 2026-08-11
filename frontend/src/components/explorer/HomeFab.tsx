"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";

/** El botón flotante de la casita ("Tu comunidad") en móvil —
 * compartido por Personas y Comunidades para que exista en ambas
 * secciones, no solo en Comunidades. Es un <Link> normal: AppShell
 * detecta el cruce de ruta hacia/desde Tu Comunidad por sí solo, sin
 * necesidad de interceptar el click. */
export default function HomeFab() {
  const { community: myCommunity, communityLoading: loadingMyCommunity } =
    useAuth();

  if (loadingMyCommunity) return null;

  const href = myCommunity ? `/comunidades/${myCommunity.id}` : "/crear/comunidad";
  const label = myCommunity ? "Ver mi comunidad" : "Crear comunidad";

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="fixed right-5 bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+1rem)] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-soft transition active:scale-95 sm:hidden"
    >
      <motion.span
        whileTap={myCommunity ? { scale: MOTION_HOME_TAP_SCALE } : undefined}
        className="inline-flex"
      >
        <HomeIcon />
      </motion.span>
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5.5 w-5.5"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
