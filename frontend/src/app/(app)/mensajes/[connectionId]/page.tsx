"use client";

import { useEffect, useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import PrivateChat from "@/components/mensajes/PrivateChat";
import { getConnections } from "@/services/connections";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { markConversationReadNow } from "@/lib/conversationReadState";
import { markNotificationsForLinkRead } from "@/services/notifications";
import { NAV_TRANSITION } from "@/lib/navTransition";
import type { UserConnection } from "@/types/connection";

export default function MensajesPage() {
  const params = useParams<{ connectionId: string }>();
  const { user } = useAuth();
  const { setChatActive } = useMobileChrome();

  const [connection, setConnection] = useState<UserConnection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const connectionId = Number(params.connectionId);

  useEffect(() => {
    setChatActive(true);
    return () => setChatActive(false);
  }, [setChatActive]);

  useEffect(() => {
    if (Number.isFinite(connectionId)) {
      markConversationReadNow(`connection:${connectionId}`);
      void markNotificationsForLinkRead(`/mensajes/${connectionId}`).catch(() => {});
    }
  }, [connectionId]);

  useEffect(() => {
    let active = true;

    getConnections()
      .then((connections) => {
        if (!active) return;

        const match = connections.find(
          (item) => item.id === connectionId
        );

        if (match) {
          setConnection(match);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [connectionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !connection || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand">
          Conversación no disponible
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-dark">
          No hemos encontrado esta conversación
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-muted">
          Puede que la conexión haya sido eliminada o que no formes
          parte de ella.
        </p>

        <Link
          href="/conexiones"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-14 bg-primary px-6 text-sm font-bold text-white shadow-button transition hover:-translate-y-0.5 hover:bg-primary-hover"
        >
          Volver a conexiones
        </Link>
      </div>
    );
  }

  const other =
    connection.requester.id === user.id
      ? connection.recipient
      : connection.requester;

  const fullName = `${other.first_name} ${other.last_name}`.trim();

  const initials = [other.first_name, other.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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

        <Link
          href={`/personas/${other.id}`}
          className="flex min-w-0 items-center gap-3"
        >
          {other.avatar_url && !avatarError ? (
            <Image
              src={other.avatar_url}
              alt=""
              width={44}
              height={44}
              unoptimized
              onError={() => setAvatarError(true)}
              className="h-11 w-11 shrink-0 rounded-14 object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-14 bg-primary text-sm font-bold text-white">
              {initials || "CF"}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-brand-dark">
              {fullName || "Persona de CoFlow"}
            </p>
            <p className="text-xs font-semibold text-muted">
              Ver perfil
            </p>
          </div>
        </Link>
      </div>

      <div className="min-h-0 flex-1 sm:flex-none">
        <PrivateChat
          connectionId={connection.id}
          currentUserId={user.id}
          variant="full"
        />
      </div>
    </div>
    </ViewTransition>
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
