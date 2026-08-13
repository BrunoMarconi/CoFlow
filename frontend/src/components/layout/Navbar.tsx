"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/layout/NotificationBell";
import { useOwnerMode } from "@/hooks/useOwnerMode";

export default function Navbar() {
  const { user } = useAuth();
  const { isOwnerMode } = useOwnerMode();
  const homeHref = isOwnerMode ? "/propietarios/pisos" : "/comunidades";

  return (
    <header className="sticky top-0 z-(--z-sticky-header) bg-background/85 pt-(--safe-top) backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-[1600px] items-center justify-between px-5 sm:px-6 md:pl-72">
        <div className="flex items-center gap-2">
          <Link
            href={homeHref}
            className="flex items-center gap-2 rounded-full bg-surface/90 px-3 py-2 shadow-soft backdrop-blur-xl md:hidden"
            aria-label="CoFlow"
          >
            <Logo size="sm" />

            <span className="font-rounded text-xl font-semibold tracking-tight text-brand-dark">
              CoFlow
            </span>
            {isOwnerMode && (
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                Pisos
              </span>
            )}
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            <Link
              href={isOwnerMode ? "/propietarios/perfil" : "/perfil"}
              aria-label="Abrir perfil"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 shadow-soft backdrop-blur-xl"
            >
              <Avatar
                name={`${user.first_name} ${user.last_name}`}
                imageUrl={user.avatar_url}
                size={38}
              />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
