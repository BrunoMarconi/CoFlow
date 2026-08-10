"use client";

import { type ReactNode, ViewTransition } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import ProfileCompletionBanner from "@/components/layout/ProfileCompletionBanner";
import SwipeNavigation from "@/components/layout/SwipeNavigation";
import ExplorerTabs from "@/components/explorer/ExplorerTabs";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { cn } from "@/lib/utils";
import { NAV_TRANSITION } from "@/lib/navTransition";

export default function AppShell({ children }: { children: ReactNode }) {
  const { isChatActive } = useMobileChrome();

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
                <ExplorerTabs />
              </>
            )}
            <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
              <SwipeNavigation>{children}</SwipeNavigation>
            </ViewTransition>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
