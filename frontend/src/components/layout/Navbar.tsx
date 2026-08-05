"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/layout/NotificationBell";
import MobileDrawer from "@/components/layout/MobileDrawer";
import { MenuIcon } from "@/components/layout/NavIcons";

export default function Navbar() {
  const { user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-(--z-sticky-header) border-b border-line bg-surface/85 pt-(--safe-top) backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {user && (
            <button
              ref={menuButtonRef}
              type="button"
              aria-label="Abrir menú"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-foreground transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:hidden"
            >
              <MenuIcon />
            </button>
          )}

          <Link
            href="/comunidades"
            className="flex items-center gap-2 md:hidden"
            aria-label="CoFlow"
          >
            <Logo size="sm" />

            <span className="text-xl font-black tracking-tight text-brand-dark">
              CoFlow
            </span>
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <Link
              href="/perfil"
              aria-label="Abrir perfil"
              className="flex h-11 w-11 items-center justify-center"
            >
              <Avatar
                name={`${user.first_name} ${user.last_name}`}
                size={38}
              />
            </Link>
          </div>
        )}
      </div>

      <MobileDrawer open={drawerOpen} onClose={closeDrawer} />
    </header>
  );
}
