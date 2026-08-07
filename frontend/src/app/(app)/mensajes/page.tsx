"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

// Diferidos: en cada visita solo se muestra uno de los dos a la vez
// (chat privado o de comunidad), según lo que el usuario seleccione.
const chatLoadingFallback = (
  <div className="flex h-full items-center justify-center">
    <Spinner />
  </div>
);
const PrivateChat = dynamic(() => import("@/components/mensajes/PrivateChat"), {
  loading: () => chatLoadingFallback,
});
const CommunityChat = dynamic(
  () => import("@/components/comunidad/CommunityChat"),
  { loading: () => chatLoadingFallback }
);
import { HomeIcon, ChevronRightIcon } from "@/components/layout/NavIcons";
import {
  getConnections,
  getPrivateMessages,
} from "@/services/connections";
import { getCommunityMessages } from "@/services/communities";
import type { UserConnection } from "@/types/connection";
import type { PrivateMessage } from "@/types/privateMessage";
import type { CommunityMessage } from "@/types/community";

async function loadAcceptedConnectionsWithLastMessages() {
  const data = await getConnections();
  const accepted = data.filter((c) => c.status === "ACCEPTED");

  const results = await Promise.all(
    accepted.map((connection) =>
      getPrivateMessages(connection.id, { limit: 1 })
        .then((messages) => [connection.id, messages[0]] as const)
        .catch(() => [connection.id, undefined] as const)
    )
  );

  const lastMessages: Record<number, PrivateMessage> = {};
  for (const [id, message] of results) {
    if (message) lastMessages[id] = message;
  }

  return { accepted, lastMessages };
}

function otherParticipant(connection: UserConnection, currentUserId: string) {
  return connection.requester.id === currentUserId
    ? connection.recipient
    : connection.requester;
}

function initialsOf(firstName: string, lastName: string) {
  return [firstName, lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPreviewTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function MensajesPage() {
  const { user, community } = useAuth();
  const searchParams = useSearchParams();
  const requestedId = Number(searchParams.get("c"));
  const requestedCommunity = searchParams.get("c") === "community";

  const [selectedId, setSelectedId] = useState<number | null>(
    !requestedCommunity && Number.isFinite(requestedId) && requestedId > 0
      ? requestedId
      : null
  );
  const [communitySelected, setCommunitySelected] = useState(
    requestedCommunity
  );

  const { data: connectionsData, isLoading: loading } = useQuery({
    queryKey: ["connections-with-last-message"],
    queryFn: loadAcceptedConnectionsWithLastMessages,
  });

  const connections = useMemo(
    () => connectionsData?.accepted ?? [],
    [connectionsData]
  );
  const lastMessages = connectionsData?.lastMessages ?? {};

  // Deriva la selección "efectiva" en vez de sincronizarla con un efecto:
  // si la selección actual ya no es válida (o no hay ninguna todavía),
  // cae a la primera conversación disponible sin un renderizado extra.
  const effectiveSelectedId = useMemo(() => {
    if (selectedId !== null && connections.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    return connections[0]?.id ?? null;
  }, [selectedId, connections]);

  const { data: communityLastMessage = null } = useQuery({
    queryKey: ["community-last-message", community?.id],
    queryFn: () =>
      getCommunityMessages(community!.id, { limit: 1 }).then(
        (messages) => messages[0] ?? null
      ),
    enabled: Boolean(community),
  });

  function selectConnection(id: number) {
    setCommunitySelected(false);
    setSelectedId(id);
  }

  function selectCommunity() {
    setCommunitySelected(true);
  }

  const selectedConnection = useMemo(
    () =>
      !communitySelected
        ? (connections.find((c) => c.id === effectiveSelectedId) ?? null)
        : null,
    [connections, effectiveSelectedId, communitySelected]
  );

  const selectedOther =
    selectedConnection && user
      ? otherParticipant(selectedConnection, user.id)
      : null;

  const { profile: selectedProfile } = usePublicProfile(selectedOther?.id ?? "");

  if (loading) {
    return (
      <div className="-mx-4 -my-6 flex flex-col border-t border-border sm:-mx-6 lg:-mx-8">
        <InboxHeader />
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-3 border-b border-border px-4 py-3"
          >
            <div className="h-11 w-11 shrink-0 rounded-full bg-surface-soft" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded-full bg-surface-soft" />
              <div className="h-3 w-2/3 rounded-full bg-surface-soft" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] flex-col sm:-mx-6 sm:h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] lg:-mx-8">
      {/* Móvil: solo lista, cada fila navega al hilo a pantalla completa ya existente. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border sm:hidden">
        <InboxHeader />

        {community && (
          <Link
            href="/mensajes/comunidad"
            className="flex items-center gap-3 border-b border-border bg-mint-50/40 px-4 py-3 transition-colors duration-180 hover:bg-mint-50"
          >
            <CommunityAvatar />
            <ConversationPreview
              name={community.name}
              lastMessage={communityLastMessage}
              badge="Comunidad"
            />
          </Link>
        )}

        {connections.length === 0 ? (
          !community && (
            <div className="p-6">
              <EmptyState
                title="Todavía no tienes conversaciones"
                description="Conecta con personas o comunidades para empezar a hablar."
              />
            </div>
          )
        ) : (
          connections.map((connection) => {
            if (!user) return null;
            const other = otherParticipant(connection, user.id);
            const lastMessage = lastMessages[connection.id];

            return (
              <Link
                key={connection.id}
                href={`/mensajes/${connection.id}`}
                className="flex items-center gap-3 border-b border-border px-4 py-3 transition-colors duration-180 hover:bg-surface-soft"
              >
                <ConversationAvatar
                  initials={initialsOf(other.first_name, other.last_name)}
                  imageUrl={other.avatar_url}
                />
                <ConversationPreview
                  name={`${other.first_name} ${other.last_name}`.trim()}
                  lastMessage={lastMessage}
                />
              </Link>
            );
          })
        )}
      </div>

      {/* Escritorio/tablet: bandeja de dos columnas, selección en el sitio. */}
      <div className="hidden min-h-0 flex-1 border-t border-border sm:grid sm:grid-cols-[340px_1fr]">
        <div className="flex min-h-0 flex-col overflow-y-auto border-r border-border">
          <InboxHeader />

          {community && (
            <button
              type="button"
              onClick={selectCommunity}
              className={`flex items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors duration-180 ${
                communitySelected
                  ? "border-primary bg-mint-50"
                  : "border-transparent hover:bg-surface-soft"
              }`}
            >
              <CommunityAvatar />
              <ConversationPreview
                name={community.name}
                lastMessage={communityLastMessage}
                badge="Comunidad"
              />
            </button>
          )}

          {connections.length === 0 ? (
            !community && (
              <div className="p-6">
                <EmptyState
                  title="Todavía no tienes conversaciones"
                  description="Conecta con personas o comunidades para empezar a hablar."
                />
              </div>
            )
          ) : (
            connections.map((connection) => {
              if (!user) return null;
              const other = otherParticipant(connection, user.id);
              const lastMessage = lastMessages[connection.id];
              const isSelected =
                !communitySelected && connection.id === effectiveSelectedId;

              return (
                <button
                  key={connection.id}
                  type="button"
                  onClick={() => selectConnection(connection.id)}
                  className={`flex items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors duration-180 ${
                    isSelected
                      ? "border-primary bg-mint-50"
                      : "border-transparent hover:bg-surface-soft"
                  }`}
                >
                  <ConversationAvatar
                    initials={initialsOf(other.first_name, other.last_name)}
                    imageUrl={other.avatar_url}
                  />
                  <ConversationPreview
                    name={`${other.first_name} ${other.last_name}`.trim()}
                    lastMessage={lastMessage}
                  />
                </button>
              );
            })
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          {communitySelected && community && user ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
                <CommunityAvatar />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-bold text-brand-dark">
                      {community.name}
                    </p>
                    <CommunityBadge />
                  </div>

                  <p className="truncate text-xs font-semibold text-muted">
                    Chat de todos los miembros
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 p-4">
                <CommunityChat
                  communityId={community.id}
                  currentUserId={user.id}
                  variant="full"
                />
              </div>
            </>
          ) : !selectedConnection || !selectedOther || !user ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-medium text-muted">
              Selecciona una conversación para empezar.
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
                <ConversationAvatar
                  initials={initialsOf(
                    selectedOther.first_name,
                    selectedOther.last_name
                  )}
                  imageUrl={selectedOther.avatar_url}
                />

                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-brand-dark">
                    {`${selectedOther.first_name} ${selectedOther.last_name}`.trim()}
                  </p>

                  {selectedProfile?.community && (
                    <p className="truncate text-xs font-semibold text-muted">
                      {selectedProfile.community.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 p-4">
                <PrivateChat
                  connectionId={selectedConnection.id}
                  currentUserId={user.id}
                  variant="full"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InboxHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4">
      <p className="text-lg font-bold text-brand-dark">Mensajes</p>

      <Link
        href="/conexiones"
        className="flex items-center gap-1 text-xs font-bold text-primary-dark transition-colors duration-180 hover:text-brand-dark"
      >
        Solicitudes de conexión
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ConversationAvatar({
  initials,
  imageUrl,
}: {
  initials: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={44}
        height={44}
        unoptimized
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {initials || "CF"}
    </div>
  );
}

function CommunityAvatar() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-14 bg-brand-dark text-white">
      <HomeIcon className="h-5 w-5" />
    </div>
  );
}

function CommunityBadge() {
  return (
    <span className="shrink-0 rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-dark">
      Comunidad
    </span>
  );
}

function ConversationPreview({
  name,
  lastMessage,
  badge,
}: {
  name: string;
  lastMessage?: PrivateMessage | CommunityMessage | null;
  badge?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-sm font-bold text-foreground">
            {name || "Persona de CoFlow"}
          </p>

          {badge && (
            <span className="shrink-0 rounded-full bg-mint-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-dark">
              {badge}
            </span>
          )}
        </div>

        {lastMessage && (
          <span className="shrink-0 text-[11px] font-semibold text-muted">
            {formatPreviewTime(lastMessage.created_at)}
          </span>
        )}
      </div>

      <p className="truncate text-xs text-secondary">
        {lastMessage ? lastMessage.content : "Todavía no hay mensajes"}
      </p>
    </div>
  );
}
