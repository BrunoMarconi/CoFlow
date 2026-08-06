"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/layout/NotificationBell";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-(--z-sticky-header) border-b border-line bg-surface/85 pt-(--safe-top) backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
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
    </header>
  );
}
