"use client";

import { useEffect, ViewTransition } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import CommunityChat from "@/components/comunidad/CommunityChat";
import { HomeIcon } from "@/components/layout/NavIcons";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { markConversationReadNow } from "@/lib/conversationReadState";
import { NAV_TRANSITION } from "@/lib/navTransition";

export default function MensajesComunidadPage() {
  const { user, community, communityLoading } = useAuth();
  const { setChatActive } = useMobileChrome();

  useEffect(() => {
    setChatActive(true);
    return () => setChatActive(false);
  }, [setChatActive]);

  useEffect(() => {
    markConversationReadNow("community");
  }, []);

  if (communityLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!community || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">
          Chat no disponible
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-dark">
          Todavía no formas parte de ninguna comunidad
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Únete o crea una comunidad para tener aquí su chat de grupo.
        </p>

        <Link
          href="/mensajes"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-14 bg-primary px-6 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          Volver a mensajes
        </Link>
      </div>
    );
  }

  return (
    <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
    <div className="mx-auto flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top)-var(--safe-bottom))] w-full max-w-3xl flex-col sm:h-auto sm:block">
      <div className="mb-3 flex shrink-0 items-center gap-3 sm:mb-4">
        <Link
          href="/mensajes"
          aria-label="Volver a mensajes"
          transitionTypes={["nav-back"]}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-surface-soft hover:text-brand-dark"
        >
          <ArrowLeftIcon />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-14 bg-brand-dark text-white">
            <HomeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-brand-dark">
              {community.name}
            </p>
            <p className="text-xs font-semibold text-muted">
              {community.member_count}{" "}
              {community.member_count === 1 ? "miembro" : "miembros"}
            </p>
          </div>
        </div>

        <Link
          href="/mi-comunidad"
          aria-label="Ver comunidad"
          title="Ver comunidad"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-brand-dark"
        >
          <MoreIcon />
        </Link>
      </div>

      <div className="min-h-0 flex-1 sm:flex-none">
        <CommunityChat
          communityId={community.id}
          currentUserId={user.id}
          variant="full"
        />
      </div>
    </div>
    </ViewTransition>
  );
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 18-6-6 6-6" />
    </svg>
  );
}
