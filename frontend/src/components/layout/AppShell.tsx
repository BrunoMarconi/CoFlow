"use client";

import { type ReactNode, ViewTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import ProfileCompletionBanner from "@/components/layout/ProfileCompletionBanner";
import SwipeNavigation from "@/components/layout/SwipeNavigation";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import ExplorerTransitionProvider from "@/providers/ExplorerTransitionProvider";
import HomeTransitionProvider, {
  useHomeTransition,
} from "@/providers/HomeTransitionProvider";
import { cn } from "@/lib/utils";
import { NAV_TRANSITION } from "@/lib/navTransition";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";

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
  const { leavingHome } = useHomeTransition();
  const prefersReducedMotion = useReducedMotion();

  // Portal a "Tu comunidad" (icono casita): la pantalla actual se
  // aleja ligeramente antes de que HomeTransitionProvider navegue de
  // verdad — la entrada desde profundidad en el otro extremo vive en
  // la propia página destino (lee homeTransitionState al montar, ver
  // mi-comunidad/page.tsx y comunidades/[id]/page.tsx), porque a
  // diferencia de este wrapper, esas páginas sí se remontan en cada
  // navegación.
  const contentAnimate = !leavingHome
    ? { opacity: 1, scale: 1, filter: "blur(0px)" }
    : prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 0.985, filter: "blur(1px)" };

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
            <motion.div
              animate={contentAnimate}
              transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
            >
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
