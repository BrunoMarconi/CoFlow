"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/layout/NotificationBell";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import ProfileCompletionRing from "@/components/ui/ProfileCompletionRing";
import { computeProfileCompletion } from "@/lib/profileCompletion";

export default function Navbar() {
  const { user } = useAuth();
  const { isOwnerMode } = useOwnerMode();
  const homeHref = isOwnerMode ? "/propietarios/pisos" : "/explorar";
  const profileCompletion = user ? computeProfileCompletion(user) : 100;
  const showProfileProgress = !isOwnerMode && profileCompletion < 100;

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
          <div className="flex items-center rounded-full border border-black/[0.055] bg-surface/92 p-1 shadow-[0_8px_28px_rgba(20,42,32,.07)] backdrop-blur-xl">
            <NotificationBell />

            <span className="mx-0.5 h-5 w-px bg-black/[0.07]" aria-hidden="true" />

            <Link
              href={isOwnerMode ? "/propietarios/perfil" : "/perfil"}
              aria-label={showProfileProgress ? `Abrir perfil, completado al ${profileCompletion}%` : "Abrir perfil"}
              className="group flex h-11 items-center gap-2 rounded-full p-1 transition-colors hover:bg-surface-soft"
            >
              {showProfileProgress && <span className="pl-2 text-[11px] font-semibold tabular-nums text-primary-dark">{profileCompletion}%</span>}
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                {showProfileProgress && <ProfileCompletionRing completion={profileCompletion} className="absolute inset-0 h-10 w-10" />}
                <Avatar name={`${user.first_name} ${user.last_name}`} imageUrl={user.avatar_url} size={showProfileProgress ? 32 : 38} />
              </span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
