"use client";

import { useEffect, useRef, type ReactNode, ViewTransition } from "react";
import { usePathname } from "next/navigation";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import ProfileCompletionBanner from "@/components/layout/ProfileCompletionBanner";
import SwipeNavigation from "@/components/layout/SwipeNavigation";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ExplorerTransitionProvider from "@/providers/ExplorerTransitionProvider";
import { cn } from "@/lib/utils";
import { NAV_TRANSITION } from "@/lib/navTransition";
import {
  MOTION_EASE,
  MOTION_HOME_NAV_DISTANCE_DESKTOP,
  MOTION_HOME_NAV_DISTANCE_MOBILE,
  MOTION_HOME_NAV_DURATION_DESKTOP,
  MOTION_HOME_NAV_DURATION_MOBILE,
  MOTION_HOME_NAV_REDUCED_DURATION,
} from "@/lib/motionTokens";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ExplorerTransitionProvider>
      <AppShellContent>{children}</AppShellContent>
    </ExplorerTransitionProvider>
  );
}

function isHomeRoute(pathname: string, ownCommunityHref: string | null) {
  return pathname === "/mi-comunidad" || pathname === ownCommunityHref;
}

function AppShellContent({ children }: { children: ReactNode }) {
  const { isChatActive } = useMobileChrome();
  const { community } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const pathname = usePathname();

  // Personas <-> Tu Comunidad: la prioridad es velocidad, no la
  // animación. La navegación nunca se retrasa (nada de setTimeout ni
  // provider intermedio) — AppShell solo compara la ruta anterior con
  // la nueva justo cuando el router ya cambió de verdad, y si cruza
  // la frontera de "Tu Comunidad" en cualquier dirección, anima SOLO
  // la entrada de la pantalla que ya está montada (fade + un puñado
  // de píxeles horizontales). No hay fase de salida real: al ser una
  // navegación dura, la pantalla anterior se destruye al instante con
  // el propio cambio de ruta, así que no hay nada que retrasar.
  // Vive en AppShell (nunca se desmonta) para que Navbar/Sidebar/
  // BottomNavigation se mantengan completamente fijos durante el
  // cambio — con animation controls imperativos porque, al no
  // remontar, `initial` no volvería a dispararse en cada navegación.
  const contentControls = useAnimationControls();
  const previousPathnameRef = useRef(pathname);
  const ownCommunityHref = community ? `/comunidades/${community.id}` : null;

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    const wasHome = isHomeRoute(previousPathnameRef.current, ownCommunityHref);
    const isHome = isHomeRoute(pathname, ownCommunityHref);
    previousPathnameRef.current = pathname;

    if (wasHome === isHome) {
      // Navegación no relacionada con Tu Comunidad: contenido visible
      // al instante, sin animación de ningún tipo.
      contentControls.set({ x: 0, opacity: 1 });
      return;
    }

    if (prefersReducedMotion) {
      contentControls.set({ opacity: 0, x: 0 });
      contentControls.start(
        { opacity: 1 },
        { duration: MOTION_HOME_NAV_REDUCED_DURATION, ease: MOTION_EASE.out }
      );
      return;
    }

    const distance = isDesktop
      ? MOTION_HOME_NAV_DISTANCE_DESKTOP
      : MOTION_HOME_NAV_DISTANCE_MOBILE;
    const duration = isDesktop
      ? MOTION_HOME_NAV_DURATION_DESKTOP
      : MOTION_HOME_NAV_DURATION_MOBILE;

    // Entrando a Tu Comunidad: llega desde la derecha (x positivo).
    // Saliendo de Tu Comunidad: llega desde la izquierda (x negativo).
    const fromX = isHome ? distance : -distance;

    contentControls.set({ x: fromX, opacity: 0 });
    contentControls.start(
      { x: 0, opacity: 1 },
      { duration, ease: MOTION_EASE.out }
    );
    // Solo debe reaccionar a cambios de ruta reales — isDesktop/
    // prefersReducedMotion se leen en el momento, no deben retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <div className="flex w-full">
        <Sidebar />

        <main
          className={cn(
            // overflow-x-hidden aquí rompería position: sticky en todo
            // lo que cuelgue de esta rama (buscadores, tabs...) — el
            // guard de scroll horizontal ya vive en html (globals.css).
            "min-w-0 flex-1 md:ml-66 md:pb-8",
            // Con un chat a pantalla completa activo en móvil, BottomNavigation
            // se oculta: reservarle espacio dejaría un hueco vacío debajo.
            isChatActive
              ? "pb-0"
              : "pb-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom))]"
          )}
        >
          <div
            className={cn(
              "mx-auto w-full max-w-7xl sm:px-6 sm:py-6 lg:px-8",
              isChatActive ? "px-0 py-0" : "px-4 py-6"
            )}
          >
            {!isChatActive && (
              <>
                <EmailVerificationBanner />
                <ProfileCompletionBanner />
              </>
            )}
            <motion.div animate={contentControls} initial={false}>
              <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
                <SwipeNavigation>{children}</SwipeNavigation>
              </ViewTransition>
            </motion.div>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
