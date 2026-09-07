"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/layout/NotificationBell";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import ProfileCompletionRing from "@/components/ui/ProfileCompletionRing";
import { computeProfileCompletion } from "@/lib/profileCompletion";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";

export default function Navbar() {
  const { user } = useAuth();
  const { isOwnerMode } = useOwnerMode();
  const { pageTitle, isTitleCollapsed } = useMobileChrome();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const prefersReducedMotion = useReducedMotion();
  // En escritorio la barra convive con el sidebar y hay altura de sobra:
  // retraerla solo aportaría desconcierto.
  const hidden = useHideOnScroll(!isDesktop && !prefersReducedMotion);
  const homeHref = isOwnerMode ? "/propietarios/pisos" : "/explorar";
  const profileCompletion = user ? computeProfileCompletion(user) : 100;
  const showProfileProgress = !isOwnerMode && profileCompletion < 100;
  const showsPageTitle = Boolean(pageTitle) && isTitleCollapsed;

  return (
    <motion.header
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }
      }
      className="sticky top-0 z-(--z-sticky-header) bg-background/85 pt-(--safe-top) backdrop-blur-xl"
    >
      <div className="mx-auto flex h-18 w-full max-w-[1600px] items-center justify-between px-5 sm:px-6 md:pl-72">
        <div className="flex min-w-0 items-center gap-2">
          {/* El logo cede el sitio al título de la pantalla cuando el
              título grande se ha desplazado fuera de vista. */}
          <AnimatePresence mode="wait" initial={false}>
            {showsPageTitle ? (
              <motion.h1
                key="page-title"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={MOTION_SPRING.snappy}
                className="truncate font-rounded text-lg font-bold tracking-[-0.02em] text-brand-dark md:hidden"
              >
                {pageTitle}
              </motion.h1>
            ) : (
              <motion.div
                key="logo"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                transition={MOTION_SPRING.snappy}
                className="md:hidden"
              >
                <Link
                  href={homeHref}
                  className="flex items-center gap-2 rounded-full bg-surface/90 px-3 py-2 shadow-soft backdrop-blur-xl"
                  aria-label="CoFlow"
                >
                  <Logo size="sm" />

                  <span className="font-rounded text-xl font-semibold tracking-tight text-brand-dark">
                    CoFlow
                  </span>
                  {isOwnerMode && (
                    <span className="text-3xs font-bold uppercase tracking-[0.12em] text-primary">
                      Pisos
                    </span>
                  )}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {user && (
          <div className="flex items-center rounded-full border border-black/[0.055] bg-surface/92 p-1 shadow-card backdrop-blur-xl">
            <NotificationBell />

            <span className="mx-0.5 h-5 w-px bg-black/[0.07]" aria-hidden="true" />

            <Link
              href={isOwnerMode ? "/propietarios/perfil" : "/perfil"}
              aria-label={showProfileProgress ? `Abrir perfil, completado al ${profileCompletion}%` : "Abrir perfil"}
              className="group flex h-11 items-center gap-2 rounded-full p-1 transition-colors hover:bg-surface-soft"
            >
              {showProfileProgress && <span className="pl-2 text-2xs font-semibold tabular-nums text-primary-dark">{profileCompletion}%</span>}
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                {showProfileProgress && <ProfileCompletionRing completion={profileCompletion} className="absolute inset-0 h-10 w-10" />}
                <Avatar name={`${user.first_name} ${user.last_name}`} imageUrl={user.avatar_url} size={showProfileProgress ? 32 : 38} />
              </span>
            </Link>
          </div>
        )}
      </div>
    </motion.header>
  );
}
