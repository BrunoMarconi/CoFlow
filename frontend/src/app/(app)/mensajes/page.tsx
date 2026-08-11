"use client";

import { useEffect, useMemo, useState, ViewTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { motion, MotionConfig } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import Spinner from "@/components/ui/Spinner";
import {
  isConversationUnread,
  markConversationReadNow,
} from "@/lib/conversationReadState";
import { NAV_TRANSITION } from "@/lib/navTransition";

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
      <div className="-mx-5 -my-4 flex flex-col border-t border-border sm:-mx-6 sm:-my-6 lg:-mx-8">
        <InboxHeader />
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-3 border-b border-border/60 px-4 py-3"
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
    <MotionConfig reducedMotion="user">
    <div className="-mx-5 -my-4 flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] flex-col sm:-mx-6 sm:-my-6 sm:h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] lg:-mx-8">
      {/* Móvil: solo lista, cada fila navega al hilo a pantalla completa ya existente. */}
      <ViewTransition enter={NAV_TRANSITION} exit={NAV_TRANSITION} default="none">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border sm:hidden">
        <InboxHeader />
        <InboxSearchAndTabs
          search={search}
          onSearchChange={setSearch}
          tab={tab}
          onTabChange={setTab}
          layoutIdPrefix="mobile"
        />

        {communityVisible && community && (
          <MotionLink
            href="/mensajes/comunidad"
            transitionTypes={["nav-forward"]}
            variants={rowVariants}
            initial="hidden"
            animate="show"
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-mint-50/60"
          >
            <CommunityAvatar />
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
            const unread = isConversationUnread(
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
                className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-200 hover:bg-surface-soft"
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
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex items-center gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors duration-200 ${
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
              const unread = isConversationUnread(
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
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-center gap-3 border-l-[3px] px-4 py-3.5 text-left transition-colors duration-200 ${
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
              <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4">
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
              <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4">
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
    </MotionConfig>
  );
}

function InboxHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-4">
      <p className="text-lg font-bold text-brand-dark">Mensajes</p>

      <div className="flex items-center gap-1">
        <motion.div whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }}>
          <Link
            href="/conexiones"
            aria-label="Solicitudes de conexión"
            title="Solicitudes de conexión"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-brand-dark"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }}>
          <Link
            href="/usuarios"
            aria-label="Nueva conversación"
            title="Nueva conversación"
            className="flex h-9 w-9 items-center justify-center text-primary-dark transition-colors duration-200 hover:text-primary"
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
  { key: "unread", label: "No leídos" },
  { key: "groups", label: "Comunidades" },
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
    <div className="shrink-0 border-b border-border/60 px-4 py-3">
      <div className="flex h-10 items-center gap-2 rounded-full bg-mint-50/50 px-4 transition-colors duration-200 focus-within:bg-mint-50">
        <SearchInput
          bare
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onClear={() => onSearchChange("")}
          placeholder="Buscar conversaciones"
        />
      </div>

      <div className="mt-3 flex gap-1 rounded-full bg-surface-muted p-1">
        {TAB_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onTabChange(option.key)}
            aria-pressed={tab === option.key}
            className="relative h-8 flex-1 rounded-full px-3 text-xs font-bold"
          >
            {tab === option.key && (
              <motion.span
                layoutId={`${layoutIdPrefix}-inbox-tab-pill`}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-full bg-brand-dark"
              />
            )}

            <span
              className={`relative transition-colors duration-200 ${
                tab === option.key
                  ? "text-white"
                  : "text-secondary hover:text-primary-dark"
              }`}
            >
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
            className={`truncate text-sm ${
              unread ? "font-semibold text-foreground" : "font-medium text-secondary"
            }`}
          >
            {name || "Persona de CoFlow"}
          </p>

          {badge && (
            <span className="shrink-0 rounded-full bg-mint-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-dark">
              {badge}
            </span>
          )}
        </div>

        {lastMessage && (
          <span className="shrink-0 text-[11px] font-medium text-muted">
            {formatPreviewTime(lastMessage.created_at)}
          </span>
        )}
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p
          className={`truncate text-xs ${unread ? "font-semibold text-foreground" : "text-muted"}`}
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

        {unread && (
          <motion.span
            aria-label="Sin leer"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
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
