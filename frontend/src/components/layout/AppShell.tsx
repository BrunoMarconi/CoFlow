"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  ViewTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import ProfileCompletionBanner from "@/components/layout/ProfileCompletionBanner";
import SwipeNavigation from "@/components/layout/SwipeNavigation";
import Toaster from "@/components/ui/Toast";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { NAV_TRANSITION } from "@/lib/navTransition";
import OwnerModeTransition from "@/components/layout/OwnerModeTransition";
import OwnerModeToggle from "@/components/propietario/OwnerModeToggle";
import {
  MOTION_EASE,
  MOTION_EXPLORER_NAV_DISTANCE_DESKTOP,
  MOTION_EXPLORER_NAV_DISTANCE_MOBILE,
  MOTION_EXPLORER_NAV_DURATION_DESKTOP,
  MOTION_EXPLORER_NAV_DURATION_MOBILE,
  MOTION_EXPLORER_NAV_REDUCED_DURATION,
  MOTION_HOME_NAV_DISTANCE_DESKTOP,
  MOTION_HOME_NAV_DISTANCE_MOBILE,
  MOTION_HOME_NAV_DURATION_DESKTOP,
  MOTION_HOME_NAV_DURATION_MOBILE,
  MOTION_HOME_NAV_REDUCED_DURATION,
  MOTION_PROFILE_PUBLIC_NAV_DISTANCE_DESKTOP,
  MOTION_PROFILE_PUBLIC_NAV_DISTANCE_MOBILE,
  MOTION_PROFILE_PUBLIC_NAV_DURATION,
  MOTION_PROFILE_PUBLIC_NAV_REDUCED_DURATION,
  MOTION_PROFILE_PUBLIC_NAV_TILT_DEG,
} from "@/lib/motionTokens";

function isHomeRoute(pathname: string, ownCommunityHref: string | null) {
  return pathname === "/mi-comunidad" || pathname === ownCommunityHref;
}

function isExplorerRoute(pathname: string) {
  return pathname === "/comunidades" || pathname === "/usuarios";
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { isChatActive } = useMobileChrome();
  const { user, community } = useAuth();
  const { isOwnerMode, transitionTarget, completeModeSwitch } = useOwnerMode();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const pathname = usePathname();
  const router = useRouter();
  // El asistente de publicación es una experiencia guiada a pantalla completa:
  // no debe competir visualmente con la navegación general de CoFlow.
  const isImmersiveOwnerFlow = pathname === "/propietarios/pisos/nuevo";

  useEffect(() => {
    if (!isOwnerMode) return;
    if (!pathname.startsWith("/propietarios")) {
      router.replace("/propietarios/pisos");
    }
  }, [isOwnerMode, pathname, router]);

  // Personas <-> Comunidades y Personas/Comunidades <-> Tu Comunidad:
  // la prioridad es velocidad, no la animación. La navegación nunca
  // se retrasa (nada de setTimeout ni provider intermedio) — AppShell
  // solo compara la ruta anterior con la nueva justo cuando el router
  // ya cambió de verdad, y si cruza alguna de esas dos fronteras,
  // anima SOLO la entrada de la pantalla que ya está montada (fade +
  // un puñado de píxeles horizontales). No hay fase de salida real:
  // al ser una navegación dura, la pantalla anterior se destruye al
  // instante con el propio cambio de ruta, así que no hay nada que
  // retrasar. Vive en AppShell (nunca se desmonta) para que Navbar/
  // Sidebar/BottomNavigation se mantengan completamente fijos durante
  // el cambio — con animation controls imperativos porque, al no
  // remontar, `initial` no volvería a dispararse en cada navegación.
  const contentControls = useAnimationControls();
  const previousPathnameRef = useRef(pathname);
  const ownCommunityHref = community ? `/comunidades/${community.id}` : null;
  const ownPublicProfileHref = user ? `/personas/${user.id}` : null;

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    const prevPathname = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    // 1) Personas <-> Comunidades.
    if (isExplorerRoute(prevPathname) && isExplorerRoute(pathname)) {
      enterFrom(pathname === "/comunidades" ? "right" : "left", {
        distanceMobile: MOTION_EXPLORER_NAV_DISTANCE_MOBILE,
        distanceDesktop: MOTION_EXPLORER_NAV_DISTANCE_DESKTOP,
        durationMobile: MOTION_EXPLORER_NAV_DURATION_MOBILE,
        durationDesktop: MOTION_EXPLORER_NAV_DURATION_DESKTOP,
        reducedDuration: MOTION_EXPLORER_NAV_REDUCED_DURATION,
      });
      return;
    }

    // 2) Personas/Comunidades <-> Tu Comunidad.
    const wasHome = isHomeRoute(prevPathname, ownCommunityHref);
    const isHome = isHomeRoute(pathname, ownCommunityHref);

    if (wasHome !== isHome) {
      enterFrom(isHome ? "right" : "left", {
        distanceMobile: MOTION_HOME_NAV_DISTANCE_MOBILE,
        distanceDesktop: MOTION_HOME_NAV_DISTANCE_DESKTOP,
        durationMobile: MOTION_HOME_NAV_DURATION_MOBILE,
        durationDesktop: MOTION_HOME_NAV_DURATION_DESKTOP,
        reducedDuration: MOTION_HOME_NAV_REDUCED_DURATION,
      });
      return;
    }

    // 3) Perfil <-> Perfil público (el propio): la única transición
    // "protagonista" de la app — más recorrido/duración que el resto y
    // un toque de inclinación 3D, a propósito (ver motionTokens.ts).
    const wasProfile = prevPathname === "/perfil";
    const wasOwnPublicProfile =
      ownPublicProfileHref !== null && prevPathname === ownPublicProfileHref;
    const isProfile = pathname === "/perfil";
    const isOwnPublicProfile =
      ownPublicProfileHref !== null && pathname === ownPublicProfileHref;

    if (
      (wasProfile && isOwnPublicProfile) ||
      (wasOwnPublicProfile && isProfile)
    ) {
      enterFrom(isOwnPublicProfile ? "right" : "left", {
        distanceMobile: MOTION_PROFILE_PUBLIC_NAV_DISTANCE_MOBILE,
        distanceDesktop: MOTION_PROFILE_PUBLIC_NAV_DISTANCE_DESKTOP,
        durationMobile: MOTION_PROFILE_PUBLIC_NAV_DURATION,
        durationDesktop: MOTION_PROFILE_PUBLIC_NAV_DURATION,
        reducedDuration: MOTION_PROFILE_PUBLIC_NAV_REDUCED_DURATION,
        tiltDeg: MOTION_PROFILE_PUBLIC_NAV_TILT_DEG,
      });
      return;
    }

    // El resto de pantallas comparte una entrada mínima y consistente.
    // No hay animación de salida ni espera antes de navegar.
    if (prefersReducedMotion) {
      contentControls.set({ x: 0, y: 0, opacity: 0, rotateY: 0 });
      contentControls.start(
        { opacity: 1 },
        { duration: 0.08, ease: MOTION_EASE.out }
      );
    } else {
      contentControls.set({ x: 0, y: 7, opacity: 0, rotateY: 0 });
      contentControls.start(
        { x: 0, y: 0, opacity: 1, rotateY: 0 },
        { duration: 0.22, ease: MOTION_EASE.out }
      );
    }

    function enterFrom(
      side: "left" | "right",
      tokens: {
        distanceMobile: number;
        distanceDesktop: number;
        durationMobile: number;
        durationDesktop: number;
        reducedDuration: number;
        tiltDeg?: number;
      }
    ) {
      if (prefersReducedMotion) {
        contentControls.set({ opacity: 0, x: 0, y: 0, rotateY: 0 });
        contentControls.start(
          { opacity: 1 },
          { duration: tokens.reducedDuration, ease: MOTION_EASE.out }
        );
        return;
      }

      const distance = isDesktop
        ? tokens.distanceDesktop
        : tokens.distanceMobile;
      const duration = isDesktop
        ? tokens.durationDesktop
        : tokens.durationMobile;
      const fromX = side === "right" ? distance : -distance;
      const fromTilt = tokens.tiltDeg
        ? side === "right"
          ? tokens.tiltDeg
          : -tokens.tiltDeg
        : 0;

      contentControls.set({ x: fromX, y: 0, opacity: 0, rotateY: fromTilt });
      contentControls.start(
        { x: 0, y: 0, opacity: 1, rotateY: 0 },
        { duration, ease: MOTION_EASE.out }
      );
    }
    // Solo debe reaccionar a cambios de ruta reales — isDesktop/
    // prefersReducedMotion/ownCommunityHref/ownPublicProfileHref se
    // leen en el momento, no deben retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleModeTransitionComplete = useCallback(() => {
    const nextMode = completeModeSwitch();

    if (nextMode === "owner") {
      router.push("/propietarios/pisos");
    } else if (nextMode === "member") {
      router.push("/perfil");
    }
  }, [completeModeSwitch, router]);

  return (
    <div className="min-h-dvh bg-background">
      {!isImmersiveOwnerFlow && <Navbar />}

      <div className="flex w-full">
        {!isImmersiveOwnerFlow && <Sidebar />}

        <main
          className={cn(
            // overflow-x-hidden aquí rompería position: sticky en todo
            // lo que cuelgue de esta rama (buscadores, tabs...) — el
            // guard de scroll horizontal ya vive en html (globals.css).
            "min-w-0 flex-1",
            isImmersiveOwnerFlow ? "pb-0" : "md:ml-66 md:pb-8",
            // Con un chat a pantalla completa activo en móvil, BottomNavigation
            // se oculta: reservarle espacio dejaría un hueco vacío debajo.
            isChatActive
              ? "pb-0"
              : "pb-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom))]"
          )}
        >
          <div
            className={cn(
              isImmersiveOwnerFlow
                ? "w-full"
                : "mx-auto w-full max-w-7xl sm:px-8 sm:py-6 lg:px-10",
              isImmersiveOwnerFlow || isChatActive
                ? "px-0 py-0"
                : "px-6 py-4 sm:px-8 sm:py-6"
            )}
          >
            {!isChatActive && !isImmersiveOwnerFlow && (
              <>
                <EmailVerificationBanner />
                <ProfileCompletionBanner />
              </>
            )}
            <motion.div
              animate={contentControls}
              initial={false}
              style={{ transformPerspective: 1000 }}
            >
              <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
                {isImmersiveOwnerFlow ? children : <SwipeNavigation>{children}</SwipeNavigation>}
              </ViewTransition>
            </motion.div>
          </div>
        </main>
      </div>

      {!isImmersiveOwnerFlow && <BottomNavigation />}
      {!isImmersiveOwnerFlow && <OwnerModeToggle />}
      <Toaster />
      {transitionTarget && (
        <OwnerModeTransition
          target={transitionTarget}
          onComplete={handleModeTransitionComplete}
        />
      )}
    </div>
  );
}
