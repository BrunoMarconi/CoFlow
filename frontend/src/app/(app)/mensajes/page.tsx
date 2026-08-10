"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import Spinner from "@/components/ui/Spinner";
import {
  isConversationUnread,
  markConversationReadNow,
} from "@/lib/conversationReadState";

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

type InboxTab = "all" | "unread" | "groups";

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
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<InboxTab>("all");

  const { data: connectionsData, isLoading: loading } = useQuery({
    queryKey: ["connections-with-last-message"],
    queryFn: loadAcceptedConnectionsWithLastMessages,
  });

  const connections = useMemo(
    () => connectionsData?.accepted ?? [],
    [connectionsData]
  );
  const lastMessages = useMemo(
    () => connectionsData?.lastMessages ?? {},
    [connectionsData]
  );

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

  // En escritorio no hay navegación a otra página al abrir un hilo, así
  // que marcarlo como leído ocurre aquí en vez de en la propia página
  // de hilo a pantalla completa (que sí lo hace en su propio montaje).
  useEffect(() => {
    if (communitySelected && community) {
      markConversationReadNow("community");
    } else if (effectiveSelectedId !== null) {
      markConversationReadNow(`connection:${effectiveSelectedId}`);
    }
  }, [communitySelected, community, effectiveSelectedId]);

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

  const communityUnread =
    Boolean(community) &&
    Boolean(user) &&
    isConversationUnread("community", communityLastMessage, user!.id);

  const normalizedSearch = search.trim().toLowerCase();

  const visibleConnections = useMemo(() => {
    if (!user) return [];

    return connections.filter((connection) => {
      if (tab === "groups") return false;

      const other = otherParticipant(connection, user.id);
      const lastMessage = lastMessages[connection.id];

      if (tab === "unread") {
        const unread = isConversationUnread(
          `connection:${connection.id}`,
          lastMessage,
          user.id
        );
        if (!unread) return false;
      }

      if (normalizedSearch) {
        const fullName =
          `${other.first_name} ${other.last_name}`.toLowerCase();
        if (!fullName.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [connections, lastMessages, tab, normalizedSearch, user]);

  const showCommunityRow = tab === "unread" ? communityUnread : true;

  const showCommunitySearchMatch =
    !normalizedSearch ||
    Boolean(community?.name.toLowerCase().includes(normalizedSearch));

  const communityVisible =
    Boolean(community) && showCommunityRow && showCommunitySearchMatch;

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

  const isEmpty = !communityVisible && visibleConnections.length === 0;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] flex-col sm:-mx-6 sm:h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] lg:-mx-8">
      {/* Móvil: solo lista, cada fila navega al hilo a pantalla completa ya existente. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border sm:hidden">
        <InboxHeader />
        <InboxSearchAndTabs
          search={search}
          onSearchChange={setSearch}
          tab={tab}
          onTabChange={setTab}
        />

        {communityVisible && community && (
          <Link
            href="/mensajes/comunidad"
            className="flex items-center gap-3 border-b border-border bg-mint-50/40 px-4 py-3 transition-colors duration-180 hover:bg-mint-50"
          >
            <CommunityAvatar />
            <ConversationPreview
              name={community.name}
              lastMessage={communityLastMessage}
              badge="Comunidad"
              unread={communityUnread}
            />
          </Link>
        )}

        {isEmpty ? (
          <div className="p-6">
            <EmptyState
              title={
                tab === "unread"
                  ? "No tienes conversaciones sin leer"
                  : "Todavía no tienes conversaciones"
              }
              description={
                tab === "unread"
                  ? "Vuelve más tarde o revisa todas tus conversaciones."
                  : "Conecta con personas o comunidades para empezar a hablar."
              }
            />
          </div>
        ) : (
          visibleConnections.map((connection) => {
            if (!user) return null;
            const other = otherParticipant(connection, user.id);
            const lastMessage = lastMessages[connection.id];
            const unread = isConversationUnread(
              `connection:${connection.id}`,
              lastMessage,
              user.id
            );

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
                  unread={unread}
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
          <InboxSearchAndTabs
            search={search}
            onSearchChange={setSearch}
            tab={tab}
            onTabChange={setTab}
          />

          {communityVisible && community && (
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
                unread={communityUnread}
              />
            </button>
          )}

          {isEmpty ? (
            <div className="p-6">
              <EmptyState
                title={
                  tab === "unread"
                    ? "No tienes conversaciones sin leer"
                    : "Todavía no tienes conversaciones"
                }
                description={
                  tab === "unread"
                    ? "Vuelve más tarde o revisa todas tus conversaciones."
                    : "Conecta con personas o comunidades para empezar a hablar."
                }
              />
            </div>
          ) : (
            visibleConnections.map((connection) => {
              if (!user) return null;
              const other = otherParticipant(connection, user.id);
              const lastMessage = lastMessages[connection.id];
              const isSelected =
                !communitySelected && connection.id === effectiveSelectedId;
              const unread = isConversationUnread(
                `connection:${connection.id}`,
                lastMessage,
                user.id
              );

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
                    unread={unread}
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
                    {community.member_count}{" "}
                    {community.member_count === 1 ? "miembro" : "miembros"}
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

      <div className="flex items-center gap-1">
        <Link
          href="/conexiones"
          aria-label="Solicitudes de conexión"
          title="Solicitudes de conexión"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-brand-dark"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Link>

        <Link
          href="/usuarios"
          aria-label="Nueva conversación"
          title="Nueva conversación"
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-soft hover:text-brand-dark"
        >
          <ComposeIcon />
        </Link>
      </div>
    </div>
  );
}

const TAB_OPTIONS: { key: InboxTab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "unread", label: "No leídos" },
  { key: "groups", label: "Grupos" },
];

function InboxSearchAndTabs({
  search,
  onSearchChange,
  tab,
  onTabChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  tab: InboxTab;
  onTabChange: (value: InboxTab) => void;
}) {
  return (
    <div className="shrink-0 border-b border-border px-4 py-3">
      <div className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface-soft px-4">
        <SearchInput
          bare
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange("")}
          placeholder="Buscar conversaciones"
        />
      </div>

      <div className="mt-3 flex gap-2">
        {TAB_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onTabChange(option.key)}
            aria-pressed={tab === option.key}
            className={`h-8 rounded-full px-3.5 text-xs font-bold transition-colors duration-180 ${
              tab === option.key
                ? "bg-brand text-white"
                : "bg-surface-muted text-secondary hover:bg-mint-50 hover:text-primary-dark"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
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
  const [imageError, setImageError] = useState(false);

  if (imageUrl && !imageError) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={44}
        height={44}
        unoptimized
        onError={() => setImageError(true)}
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
  unread = false,
}: {
  name: string;
  lastMessage?: PrivateMessage | CommunityMessage | null;
  badge?: string;
  unread?: boolean;
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

      <div className="flex items-center justify-between gap-2">
        <p
          className={`truncate text-xs ${unread ? "font-bold text-foreground" : "text-secondary"}`}
        >
          {lastMessage ? lastMessage.content : "Todavía no hay mensajes"}
        </p>

        {unread && (
          <span
            aria-label="Sin leer"
            className="h-2 w-2 shrink-0 rounded-full bg-primary"
          />
        )}
      </div>
    </div>
  );
}

function ComposeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4.5 w-4.5"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
