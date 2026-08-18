"use client";

import { useEffect, useMemo, useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import ChatSettingsSheet from "@/components/chat/ChatSettingsSheet";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import Spinner from "@/components/ui/Spinner";
import UserSafetyActions from "@/components/usuario/UserSafetyActions";
import {
  isConversationUnread,
  markConversationReadNow,
} from "@/lib/conversationReadState";
import { CHAT_MUTE_CHANGED_EVENT, isChatMuted } from "@/lib/chatMute";
import { NAV_TRANSITION } from "@/lib/navTransition";
import { MOTION_SPRING } from "@/lib/motionTokens";

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
import { HomeIcon } from "@/components/layout/NavIcons";
import { getPrivateConversationInbox } from "@/services/connections";
import { getCommunityMessages } from "@/services/communities";
import type { UserConnection } from "@/types/connection";
import type { PrivateMessage } from "@/types/privateMessage";
import type { CommunityMessage } from "@/types/community";
import {
  CHAT_MESSAGES_CHANGED_EVENT,
  type ChatMessageChangedDetail,
} from "@/lib/chatEvents";

type InboxTab = "all" | "groups" | "people" | "unread";

const MotionLink = motion.create(Link);

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

async function loadAcceptedConnectionsWithLastMessages() {
  const summaries = await getPrivateConversationInbox();
  const accepted = summaries
    .map((summary) => summary.connection)
    .filter((connection) => connection.status === "ACCEPTED");

  const lastMessages: Record<number, PrivateMessage> = {};
  for (const summary of summaries) {
    if (summary.last_message) {
      lastMessages[summary.connection.id] = summary.last_message;
    }
  }

  return { accepted, lastMessages };
}

type InboxData = Awaited<
  ReturnType<typeof loadAcceptedConnectionsWithLastMessages>
>;

function inboxDataIsEquivalent(previous: InboxData, next: InboxData) {
  if (previous.accepted.length !== next.accepted.length) return false;

  const sameConnections = previous.accepted.every((connection, index) => {
    const nextConnection = next.accepted[index];
    if (!nextConnection) return false;
    return (
      connection.id === nextConnection.id &&
      connection.status === nextConnection.status &&
      connection.requester.id === nextConnection.requester.id &&
      connection.recipient.id === nextConnection.recipient.id &&
      connection.requester.first_name === nextConnection.requester.first_name &&
      connection.requester.last_name === nextConnection.requester.last_name &&
      connection.recipient.first_name === nextConnection.recipient.first_name &&
      connection.recipient.last_name === nextConnection.recipient.last_name
    );
  });
  if (!sameConnections) return false;

  return next.accepted.every((connection) => {
    const previousMessage = previous.lastMessages[connection.id];
    const nextMessage = next.lastMessages[connection.id];
    if (!previousMessage || !nextMessage) return previousMessage === nextMessage;
    return (
      previousMessage.id === nextMessage.id &&
      previousMessage.content === nextMessage.content &&
      previousMessage.created_at === nextMessage.created_at &&
      previousMessage.sender.id === nextMessage.sender.id
    );
  });
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
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const difference = Math.round((today.getTime() - messageDay.getTime()) / 86_400_000);
  if (difference === 0) return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (difference === 1) return "Ayer";
  if (difference > 1 && difference < 7) return new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date);
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}

export default function MensajesPage() {
  const { user, community, markNotificationsForLinkAsRead } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [, forceMuteRerender] = useState(0);

  useEffect(() => {
    const handleMuteChanged = () => forceMuteRerender((value) => value + 1);
    window.addEventListener(CHAT_MUTE_CHANGED_EVENT, handleMuteChanged);
    return () =>
      window.removeEventListener(CHAT_MUTE_CHANGED_EVENT, handleMuteChanged);
  }, []);

  const {
    data: connectionsData,
    isLoading: loading,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ["connections-with-last-message"],
    queryFn: loadAcceptedConnectionsWithLastMessages,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    structuralSharing: (previous, next) => {
      const previousInbox = previous as InboxData | undefined;
      const nextInbox = next as InboxData;
      return previousInbox && inboxDataIsEquivalent(previousInbox, nextInbox)
        ? previousInbox
        : nextInbox;
    },
  });

  useEffect(() => {
    const refreshPreview = (event: Event) => {
      const detail = (event as CustomEvent<ChatMessageChangedDetail>).detail;
      if (!detail) {
        void refetchInbox();
        return;
      }

      if (detail.threadKey === "community") {
        queryClient.setQueryData(
          ["community-last-message", community?.id],
          detail.message as CommunityMessage
        );
        return;
      }

      const match = /^connection:(\d+)$/.exec(detail.threadKey);
      if (!match) return;
      const connectionId = Number(match[1]);

      queryClient.setQueryData<InboxData>(["connections-with-last-message"], (current) => {
        if (!current) return current;
        return {
          ...current,
          lastMessages: {
            ...current.lastMessages,
            [connectionId]: detail.message as PrivateMessage,
          },
        };
      });
    };

    window.addEventListener(CHAT_MESSAGES_CHANGED_EVENT, refreshPreview);
    return () =>
      window.removeEventListener(CHAT_MESSAGES_CHANGED_EVENT, refreshPreview);
  }, [community?.id, queryClient, refetchInbox]);

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
      void markNotificationsForLinkAsRead("/mensajes/comunidad").catch(() => {});
    } else if (effectiveSelectedId !== null) {
      markConversationReadNow(`connection:${effectiveSelectedId}`);
      void markNotificationsForLinkAsRead(`/mensajes/${effectiveSelectedId}`).catch(() => {});
    }
  }, [communitySelected, community, effectiveSelectedId, markNotificationsForLinkAsRead]);

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
    !isChatMuted("community") &&
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

  const showCommunityRow =
    tab === "people" ? false : tab === "unread" ? communityUnread : true;

  const showCommunitySearchMatch =
    !normalizedSearch ||
    Boolean(community?.name.toLowerCase().includes(normalizedSearch));

  const communityVisible =
    Boolean(community) && showCommunityRow && showCommunitySearchMatch;

  if (loading) {
    return (
      <div className="-mx-5 -my-4 flex flex-col border-t border-border sm:-mx-6 sm:-my-6 lg:-mx-8">
        <InboxHeader />
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-3.5 border-b border-border px-4 py-3.5"
          >
            <div className="h-14 w-14 shrink-0 rounded-full bg-surface-soft sm:h-11 sm:w-11" />
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
    <MotionConfig reducedMotion="user">
    <div className="mx-auto flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top)-1rem)] w-full max-w-7xl flex-col sm:-mx-6 sm:-my-6 sm:h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] sm:w-auto lg:-mx-8">
      {/* Móvil: solo lista, cada fila navega al hilo a pantalla completa ya existente. */}
      <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:hidden">
        <div className="sticky top-0 z-20 bg-background/95 pb-1 backdrop-blur-xl">
          <InboxHeader />
          <InboxSearchAndTabs
            search={search}
            onSearchChange={setSearch}
            tab={tab}
            onTabChange={setTab}
            layoutIdPrefix="mobile"
          />
        </div>

        {communityVisible && community && (
          <MotionLink
            href="/mensajes/comunidad"
            transitionTypes={["nav-forward"]}
            variants={rowVariants}
            initial="hidden"
            animate="show"
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex min-h-20 items-center gap-3.5 border-b border-border px-1 py-3.5 transition-colors duration-200 active:bg-surface-soft"
          >
            <CommunityAvatar imageUrl={community.cover_image_url} name={community.name} />
            <ConversationPreview
              name={community.name}
              lastMessage={communityLastMessage}
              badge="Comunidad"
              unread={communityUnread}
              lastMessageAuthorLabel={
                communityLastMessage
                  ? communityLastMessage.sender.id === user?.id
                    ? "Tú"
                    : communityLastMessage.sender.first_name
                  : undefined
              }
            />
          </MotionLink>
        )}

        {isEmpty ? (
          <div className="p-6">
            <EmptyState
              flat
              variant="messages"
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
          visibleConnections.map((connection, index) => {
            if (!user) return null;
            const other = otherParticipant(connection, user.id);
            const lastMessage = lastMessages[connection.id];
            const unread =
              !isChatMuted(`connection:${connection.id}`) &&
              isConversationUnread(
                `connection:${connection.id}`,
                lastMessage,
                user.id
              );

            return (
              <MotionLink
                key={connection.id}
                href={`/mensajes/${connection.id}`}
                transitionTypes={["nav-forward"]}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                  delay: Math.min(index, 8) * 0.02,
                }}
                whileTap={{ scale: 0.985 }}
                className="flex min-h-20 items-center gap-3.5 border-b border-border px-1 py-3.5 transition-colors duration-200 active:bg-surface-soft"
              >
                <ConversationAvatar
                  initials={initialsOf(other.first_name, other.last_name)}
                  imageUrl={other.avatar_url}
                />
                <ConversationPreview
                  name={`${other.first_name} ${other.last_name}`.trim()}
                  lastMessage={lastMessage}
                  unread={unread}
                  lastMessageAuthorLabel={
                    lastMessage && lastMessage.sender.id === user.id
                      ? "Tú"
                      : undefined
                  }
                />
              </MotionLink>
            );
          })
        )}

        <Link
          href="/usuarios"
          className="flex items-center gap-3.5 border-b border-border px-1 py-3.5 transition-colors duration-200 active:bg-surface-soft"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
            <ComposeIcon />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-extrabold text-foreground">
              Inicia una nueva conversación
            </span>
            <span className="mt-1 block truncate text-sm text-secondary">
              Conoce a más personas o encuentra tu comunidad ideal.
            </span>
          </span>
        </Link>
      </div>
      </ViewTransition>

      {/* Escritorio/tablet: bandeja de dos columnas, selección en el sitio. */}
      <div className="hidden min-h-0 flex-1 border-t border-border sm:grid sm:grid-cols-[340px_1fr]">
        <div className="flex min-h-0 flex-col overflow-y-auto border-r border-border">
          <InboxHeader />
          <InboxSearchAndTabs
            search={search}
            onSearchChange={setSearch}
            tab={tab}
            onTabChange={setTab}
            layoutIdPrefix="desktop"
          />

          {communityVisible && community && (
            <motion.button
              type="button"
              onClick={selectCommunity}
              variants={rowVariants}
              initial="hidden"
              animate="show"
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left transition-colors duration-150 ${
                communitySelected
                  ? "bg-surface-soft"
                  : "hover:bg-surface-soft/60"
              }`}
            >
              <CommunityAvatar imageUrl={community.cover_image_url} name={community.name} />
              <ConversationPreview
                name={community.name}
                lastMessage={communityLastMessage}
                badge="Comunidad"
                unread={communityUnread}
                lastMessageAuthorLabel={
                  communityLastMessage
                    ? communityLastMessage.sender.id === user?.id
                      ? "Tú"
                      : communityLastMessage.sender.first_name
                    : undefined
                }
              />
            </motion.button>
          )}

          {isEmpty ? (
            <div className="p-6">
              <EmptyState
                flat
                variant="messages"
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
            visibleConnections.map((connection, index) => {
              if (!user) return null;
              const other = otherParticipant(connection, user.id);
              const lastMessage = lastMessages[connection.id];
              const isSelected =
                !communitySelected && connection.id === effectiveSelectedId;
              const unread =
                !isChatMuted(`connection:${connection.id}`) &&
                isConversationUnread(
                `connection:${connection.id}`,
                lastMessage,
                user.id
              );

              return (
                <motion.button
                  key={connection.id}
                  type="button"
                  onClick={() => selectConnection(connection.id)}
                  variants={rowVariants}
                  initial="hidden"
                  animate="show"
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                    delay: Math.min(index, 8) * 0.02,
                  }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-center gap-3 border-b border-border/60 px-4 py-3.5 text-left transition-colors duration-150 ${
                    isSelected
                      ? "bg-surface-soft"
                      : "hover:bg-surface-soft/60"
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
                    lastMessageAuthorLabel={
                      lastMessage && lastMessage.sender.id === user.id
                        ? "Tú"
                        : undefined
                    }
                  />
                </motion.button>
              );
            })
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          {communitySelected && community && user ? (
            <>
              <button
                type="button"
                onClick={() => setChatSettingsOpen(true)}
                className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4 text-left hover:bg-surface-soft/60"
              >
                <CommunityAvatar imageUrl={community.cover_image_url} name={community.name} />

                <div className="min-w-0 flex-1">
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
              </button>

              <div className="min-h-0 flex-1 p-4">
                <CommunityChat
                  communityId={community.id}
                  currentUserId={user.id}
                  variant="full"
                />
              </div>

              <ChatSettingsSheet
                open={chatSettingsOpen}
                onClose={() => setChatSettingsOpen(false)}
                threadKey="community"
                avatar={<CommunityAvatar imageUrl={community.cover_image_url} name={community.name} />}
                title={community.name}
                subtitle={`${community.member_count} ${community.member_count === 1 ? "miembro" : "miembros"}`}
                viewLabel="Ver comunidad"
                onView={() => router.push("/mi-comunidad")}
              />
            </>
          ) : !selectedConnection || !selectedOther || !user ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-medium text-muted">
              Selecciona una conversación para empezar.
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setChatSettingsOpen(true)}
                className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4 text-left hover:bg-surface-soft/60"
              >
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
              </button>

              <div className="min-h-0 flex-1 p-4">
                <PrivateChat
                  connectionId={selectedConnection.id}
                  currentUserId={user.id}
                  variant="full"
                />
              </div>

              <ChatSettingsSheet
                open={chatSettingsOpen}
                onClose={() => setChatSettingsOpen(false)}
                threadKey={`connection:${selectedConnection.id}`}
                avatar={
                  <ConversationAvatar
                    initials={initialsOf(selectedOther.first_name, selectedOther.last_name)}
                    imageUrl={selectedOther.avatar_url}
                  />
                }
                title={`${selectedOther.first_name} ${selectedOther.last_name}`.trim()}
                viewLabel="Ver perfil"
                onView={() => router.push(`/personas/${selectedOther.id}`)}
                onOpenSafety={() => setSafetyOpen(true)}
              />
            </>
          )}
        </div>
      </div>
      {selectedOther && selectedConnection && (
        <UserSafetyActions
          open={safetyOpen}
          userId={selectedOther.id}
          firstName={selectedOther.first_name || "esta persona"}
          onClose={() => setSafetyOpen(false)}
          onBlocked={() => {
            queryClient.setQueryData<InboxData>(
              ["connections-with-last-message"],
              (current) =>
                current && {
                  accepted: current.accepted.filter(
                    (connection) => connection.id !== selectedConnection.id
                  ),
                  lastMessages: Object.fromEntries(
                    Object.entries(current.lastMessages).filter(
                      ([connectionId]) =>
                        Number(connectionId) !== selectedConnection.id
                    )
                  ),
                }
            );
            setSelectedId(null);
          }}
        />
      )}
    </div>
    </MotionConfig>
  );
}

function InboxHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between pb-3 pt-2 sm:border-b sm:border-border/60 sm:px-4 sm:py-3">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-foreground sm:text-base sm:tracking-normal">
        Mensajes
      </h1>

      <div className="flex items-center gap-1">
        <motion.div whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }}>
          <Link
            href="/conexiones"
            aria-label="Gestionar conexiones"
            title="Gestionar conexiones"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-foreground"
          >
            <FilterIcon />
          </Link>
        </motion.div>

        <motion.div whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }}>
          <Link
            href="/usuarios"
            aria-label="Nueva conversación"
            title="Nueva conversación"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-primary"
          >
            <ComposeIcon />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

const TAB_OPTIONS: { key: InboxTab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "groups", label: "Comunidades" },
  { key: "people", label: "Personas" },
  { key: "unread", label: "Sin leer" },
];

function InboxSearchAndTabs({
  search,
  onSearchChange,
  tab,
  onTabChange,
  layoutIdPrefix,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  tab: InboxTab;
  onTabChange: (value: InboxTab) => void;
  layoutIdPrefix: string;
}) {
  return (
    <div
      className="shrink-0 pb-3 sm:border-b sm:border-border/60 sm:px-4 sm:py-3"
      data-layout-prefix={layoutIdPrefix}
    >
      <div className="flex h-11 items-center gap-2 rounded-full bg-surface-soft px-4 transition-colors duration-200 focus-within:bg-surface focus-within:ring-2 focus-within:ring-primary/20 sm:h-9">
        <SearchInput
          bare
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange("")}
          placeholder="Buscar conversaciones"
        />
      </div>

      <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible">
        {TAB_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onTabChange(option.key)}
            aria-pressed={tab === option.key}
            className={`relative flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-full px-4 text-xs font-semibold transition-colors duration-200 sm:h-8 sm:min-w-0 sm:px-2 sm:text-[11px] ${
              tab === option.key
                ? "text-white"
                : "bg-surface-soft text-foreground hover:bg-surface-soft/70"
            }`}
          >
            {tab === option.key && (
              <motion.span
                layoutId={`${layoutIdPrefix}-tab-indicator`}
                transition={MOTION_SPRING.snappy}
                className="absolute inset-0 rounded-full bg-primary"
              />
            )}
            <span className="relative block min-w-0 whitespace-nowrap">
              {option.label}
            </span>
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
        className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-11 sm:w-11"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-soft text-sm font-bold text-primary-dark sm:h-11 sm:w-11">
      {initials || "CF"}
    </div>
  );
}

function CommunityAvatar({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  const [imageError, setImageError] = useState(false);

  if (imageUrl && !imageError) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={56}
        height={56}
        unoptimized
        onError={() => setImageError(true)}
        className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-11 sm:w-11"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary sm:h-11 sm:w-11">
      <HomeIcon className="h-5 w-5" />
    </div>
  );
}

function CommunityBadge() {
  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-dark">
      Comunidad
    </span>
  );
}

function ConversationPreview({
  name,
  lastMessage,
  badge,
  unread = false,
  lastMessageAuthorLabel,
}: {
  name: string;
  lastMessage?: PrivateMessage | CommunityMessage | null;
  badge?: string;
  unread?: boolean;
  lastMessageAuthorLabel?: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className="truncate text-base font-extrabold text-foreground sm:text-sm"
          >
            {name || "Persona de CoFlow"}
          </p>

          {badge && (
            <span className="shrink-0 rounded-full border border-primary/20 bg-surface px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-dark shadow-soft">
              {badge}
            </span>
          )}
        </div>

        {lastMessage && (
          <span className="shrink-0 text-xs font-medium text-secondary sm:text-[11px]">
            {formatPreviewTime(lastMessage.created_at)}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p
          className={`truncate text-sm leading-5 sm:text-xs ${unread ? "font-semibold text-foreground" : "text-secondary"}`}
        >
          {lastMessage ? (
            <>
              {lastMessageAuthorLabel && (
                <span
                  className={
                    lastMessageAuthorLabel === "Tú"
                      ? "text-secondary"
                      : "text-primary-dark"
                  }
                >
                  {lastMessageAuthorLabel}:{" "}
                </span>
              )}
              {lastMessage.content}
            </>
          ) : (
            "Todavía no hay mensajes"
          )}
        </p>

        <span className="flex shrink-0 items-center gap-2">
          {unread && (
            <motion.span
              aria-label="Sin leer"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_3px_var(--surface-soft)]"
            />
          )}
        </span>
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 6h10" />
      <path d="M4 12h7" />
      <path d="M4 18h4" />
      <circle cx="17" cy="6" r="1.5" fill="currentColor" stroke="none" />
    </svg>
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

