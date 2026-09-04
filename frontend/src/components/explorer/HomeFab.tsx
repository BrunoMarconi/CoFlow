"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { MOTION_HOME_TAP_SCALE } from "@/lib/motionTokens";

/** El botón flotante de la casita ("Tu comunidad") en móvil —
 * compartido por Personas y Comunidades para que exista en ambas
 * secciones, no solo en Comunidades. Es un <Link> normal: AppShell
 * detecta el cruce de ruta hacia/desde Tu Comunidad por sí solo, sin
 * necesidad de interceptar el click. */
export default function HomeFab() {
  const [portalReady, setPortalReady] = useState(false);
  const { community: myCommunity, communityLoading: loadingMyCommunity } =
    useAuth();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPortalReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (loadingMyCommunity || !portalReady) return null;

  const href = myCommunity ? `/comunidades/${myCommunity.id}` : "/crear/comunidad";
  const label = myCommunity ? "Ver mi comunidad" : "Crear comunidad";

  return createPortal(
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="fixed right-[calc(1.25rem+var(--safe-right))] bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+1rem)] z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_12px_32px_rgba(13,59,42,.2)] transition active:scale-95 md:hidden"
    >
      <motion.span
        whileTap={myCommunity ? { scale: MOTION_HOME_TAP_SCALE } : undefined}
        className="inline-flex"
      >
        <HomeIcon />
      </motion.span>
    </Link>,
    document.body
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
