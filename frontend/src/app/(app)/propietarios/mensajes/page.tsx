"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MessageCircle, Search } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { getConnections, getPrivateMessages } from "@/services/connections";
import type { UserConnection } from "@/types/connection";
import type { PrivateMessage } from "@/types/privateMessage";

async function getOwnerConversations() {
  const connections = (await getConnections()).filter(
    (connection) => connection.status === "ACCEPTED"
  );
  const messages = await Promise.all(
    connections.map(async (connection) => {
      const latest = await getPrivateMessages(connection.id, { limit: 1 }).catch(
        () => []
      );
      return [connection.id, latest[0]] as const;
    })
  );

  return {
    connections,
    latest: Object.fromEntries(messages) as Record<
      number,
      PrivateMessage | undefined
    >,
  };
}

function otherParticipant(connection: UserConnection, userId: string) {
  return connection.requester.id === userId
    ? connection.recipient
    : connection.requester;
}

export default function OwnerMessagesPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["owner-conversations"],
    queryFn: getOwnerConversations,
    enabled: Boolean(user),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const connections = data?.connections ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl pb-8">
      <header>
        <p className="text-sm font-bold text-primary">Espacio propietario</p>
        <h1 className="mt-1 font-rounded text-4xl font-bold tracking-[-0.04em] text-brand-dark sm:text-5xl">
          Mensajes
        </h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Habla con las personas interesadas de forma sencilla.
        </p>
      </header>

      <label className="mt-7 flex h-13 items-center gap-3 rounded-full border border-border bg-surface px-5 shadow-soft focus-within:border-primary/30">
        <Search className="h-5 w-5 text-secondary" />
        <input
          aria-label="Buscar conversaciones"
          placeholder="Buscar conversaciones"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-secondary/60"
        />
      </label>

      {connections.length === 0 ? (
        <section className="mt-6 rounded-24 border border-border bg-surface px-6 py-14 text-center shadow-soft">
          <MessageCircle className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-5 text-2xl font-bold text-brand-dark">
            Aún no hay conversaciones
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary">
            Los mensajes de las personas interesadas aparecerán aquí.
          </p>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-24 border border-border bg-surface shadow-soft">
          {connections.map((connection) => {
            if (!user) return null;
            const person = otherParticipant(connection, user.id);
            const name = `${person.first_name} ${person.last_name}`.trim();
            const lastMessage = data?.latest[connection.id];

            return (
              <Link
                key={connection.id}
                href={`/mensajes/${connection.id}`}
                className="flex items-center gap-4 border-b border-border p-4 transition last:border-b-0 hover:bg-surface-soft sm:p-5"
              >
                <Avatar name={name} imageUrl={person.avatar_url} size={52} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-brand-dark">
                    {name}
                  </span>
                  <span className="mt-1 block truncate text-sm text-secondary">
                    {lastMessage?.content ?? "Inicia la conversación"}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-secondary" />
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
