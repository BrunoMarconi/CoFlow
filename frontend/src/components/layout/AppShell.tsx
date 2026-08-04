"use client";

import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import EmailVerificationBanner from "@/components/layout/EmailVerificationBanner";
import SwipeNavigation from "@/components/layout/SwipeNavigation";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: ReactNode }) {
  const { isChatActive } = useMobileChrome();

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <Navbar />

      <div className="mx-auto flex w-full max-w-[1600px]">
        <Sidebar />

        <main
          className={cn(
            "min-w-0 flex-1 overflow-x-hidden md:pb-8",
            // Con un chat a pantalla completa activo en móvil, BottomNavigation
            // se oculta: reservarle espacio dejaría un hueco vacío debajo.
            isChatActive
              ? "pb-0"
              : "pb-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+1rem)]"
          )}
        >
          <div
            className={cn(
              "mx-auto w-full max-w-[1440px] sm:px-6 sm:py-6 lg:px-8",
              isChatActive ? "px-0 py-0" : "px-4 py-6"
            )}
          >
            {!isChatActive && <EmailVerificationBanner />}
            <SwipeNavigation>{children}</SwipeNavigation>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
