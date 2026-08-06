"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import PrivateChat from "@/components/mensajes/PrivateChat";
import {
  getConnections,
  getPrivateMessages,
} from "@/services/connections";
import type { UserConnection } from "@/types/connection";
import type { PrivateMessage } from "@/types/privateMessage";

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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const requestedId = Number(searchParams.get("c"));

  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMessages, setLastMessages] = useState<
    Record<number, PrivateMessage>
  >({});
  const [selectedId, setSelectedId] = useState<number | null>(
    Number.isFinite(requestedId) && requestedId > 0 ? requestedId : null
  );

  useEffect(() => {
    let active = true;

    getConnections()
      .then((data) => {
        if (!active) return;

        const accepted = data.filter((c) => c.status === "ACCEPTED");
        setConnections(accepted);
        setSelectedId((current) =>
          current !== null && accepted.some((c) => c.id === current)
            ? current
            : (accepted[0]?.id ?? null)
        );

        Promise.all(
          accepted.map((connection) =>
            getPrivateMessages(connection.id, { limit: 1 })
              .then((messages) => [connection.id, messages[0]] as const)
              .catch(() => [connection.id, undefined] as const)
          )
        ).then((results) => {
          if (!active) return;

          const map: Record<number, PrivateMessage> = {};
          for (const [id, message] of results) {
            if (message) map[id] = message;
          }
          setLastMessages(map);
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedConnection = useMemo(
    () => connections.find((c) => c.id === selectedId) ?? null,
    [connections, selectedId]
  );

  const selectedOther =
    selectedConnection && user
      ? otherParticipant(selectedConnection, user.id)
      : null;

  const { profile: selectedProfile } = usePublicProfile(selectedOther?.id ?? "");

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] flex-col sm:-mx-6 sm:h-[calc(100dvh-var(--mobile-header-height)-var(--safe-top))] lg:-mx-8">
      {/* Móvil: solo lista, cada fila navega al hilo a pantalla completa ya existente. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border sm:hidden">
        <InboxHeader />

        {connections.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Todavía no tienes conversaciones"
              description="Conecta con personas o comunidades para empezar a hablar."
            />
          </div>
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

          {connections.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Todavía no tienes conversaciones"
                description="Conecta con personas o comunidades para empezar a hablar."
              />
            </div>
          ) : (
            connections.map((connection) => {
              if (!user) return null;
              const other = otherParticipant(connection, user.id);
              const lastMessage = lastMessages[connection.id];
              const isSelected = connection.id === selectedId;

              return (
                <button
                  key={connection.id}
                  type="button"
                  onClick={() => setSelectedId(connection.id)}
                  className={`flex items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors duration-180 ${
                    isSelected
                      ? "border-primary bg-mint-50"
                      : "border-transparent hover:bg-surface-soft"
                  }`}
                >
                  <ConversationAvatar
                    initials={initialsOf(other.first_name, other.last_name)}
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
          {!selectedConnection || !selectedOther || !user ? (
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
        className="text-xs font-bold text-primary-dark hover:text-brand-dark"
      >
        Solicitudes de conexión
      </Link>
    </div>
  );
}

function ConversationAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {initials || "CF"}
    </div>
  );
}

function ConversationPreview({
  name,
  lastMessage,
}: {
  name: string;
  lastMessage?: PrivateMessage;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-bold text-foreground">
          {name || "Persona de CoFlow"}
        </p>

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
