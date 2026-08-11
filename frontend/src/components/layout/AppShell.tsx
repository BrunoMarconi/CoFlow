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
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ExplorerTransitionProvider from "@/providers/ExplorerTransitionProvider";
import HomeTransitionProvider, {
  useHomeTransition,
} from "@/providers/HomeTransitionProvider";
import { consumeArrivingHomeDirection } from "@/lib/homeTransitionState";
import { cn } from "@/lib/utils";
import { NAV_TRANSITION } from "@/lib/navTransition";
import {
  MOTION_EASE,
  MOTION_HOME_ENTER_DURATION,
  MOTION_HOME_EXIT_DURATION,
  MOTION_HOME_SLIDE_DESKTOP,
  MOTION_HOME_SLIDE_MOBILE,
} from "@/lib/motionTokens";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <HomeTransitionProvider>
      <ExplorerTransitionProvider>
        <AppShellContent>{children}</AppShellContent>
      </ExplorerTransitionProvider>
    </HomeTransitionProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const { isChatActive } = useMobileChrome();
  const { homeDirection } = useHomeTransition();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const pathname = usePathname();

  // Slide vertical entre Tu Comunidad y el resto de la app — vive
  // aquí (no en cada página) porque AppShell es lo único que no se
  // desmonta con la navegación: Navbar/Sidebar/BottomNavigation nunca
  // saltan ni se remontan durante la transición, solo este wrapper
  // del contenido se anima. Se usan animation controls imperativos en
  // vez de `animate`/`initial` declarativos porque, al no remontar,
  // `initial` no se volvería a disparar en cada navegación.
  const contentControls = useAnimationControls();
  const previousPathnameRef = useRef(pathname);
  const slideDistance = isDesktop
    ? MOTION_HOME_SLIDE_DESKTOP
    : MOTION_HOME_SLIDE_MOBILE;

  // 1) Salida: la pantalla actual baja (entrando a Tu Comunidad) o
  // sube (saliendo de Tu Comunidad) justo antes de que
  // HomeTransitionProvider navegue de verdad.
  useEffect(() => {
    if (!homeDirection) return;

    if (prefersReducedMotion) {
      contentControls.start(
        { opacity: 0 },
        { duration: MOTION_HOME_EXIT_DURATION, ease: MOTION_EASE.standard }
      );
      return;
    }

    const y = homeDirection === "enter" ? slideDistance : -slideDistance;

    contentControls.start(
      { y, opacity: 0 },
      { duration: MOTION_HOME_EXIT_DURATION, ease: MOTION_EASE.standard }
    );
  }, [homeDirection, slideDistance, prefersReducedMotion, contentControls]);

  // 2) Entrada: en cuanto la ruta cambia de verdad (la navegación ya
  // ocurrió), si veníamos de un salto de la casita, la nueva pantalla
  // entra desde arriba ("enter") o desde abajo ("exit"). Cualquier
  // otra navegación (no relacionada con la casita) simplemente deja
  // el contenido visible, sin animación.
  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;

    const arrivingDirection = consumeArrivingHomeDirection();

    if (!arrivingDirection) {
      contentControls.set({ y: 0, opacity: 1 });
      return;
    }

    if (prefersReducedMotion) {
      contentControls.set({ opacity: 0 });
      contentControls.start(
        { opacity: 1 },
        { duration: MOTION_HOME_ENTER_DURATION, ease: MOTION_EASE.standard }
      );
      return;
    }

    const fromY = arrivingDirection === "enter" ? -slideDistance : slideDistance;

    contentControls.set({ y: fromY, opacity: 0 });
    contentControls.start(
      { y: 0, opacity: 1 },
      { duration: MOTION_HOME_ENTER_DURATION, ease: MOTION_EASE.standard }
    );
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
