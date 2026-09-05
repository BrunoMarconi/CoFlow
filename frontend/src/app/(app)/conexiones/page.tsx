"use client";

import { useEffect, useState, ViewTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock3,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Send,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import SkeletonCard from "@/components/ui/SkeletonCard";
import UserAvatar from "@/components/ui/UserAvatar";
import { detailTransitionName } from "@/lib/detailTransitions";
import {
  acceptConnection,
  cancelConnection,
  deleteConnection,
  getConnectionOverview,
  rejectConnection,
} from "@/services/connections";
import {
  CONNECTION_OVERVIEW_QUERY_KEY,
  refreshConnectionQueries,
  setCachedProfileConnection,
} from "@/lib/connectionQueryState";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type {
  UserConnection,
  UserConnectionOverview,
  UserConnectionParticipant,
} from "@/types/connection";

type Tab = "conectadas" | "recibidas" | "enviadas";

const VALID_TABS: Tab[] = ["conectadas", "recibidas", "enviadas"];

function isValidTab(value: string | null): value is Tab {
  return value !== null && (VALID_TABS as string[]).includes(value);
}

export default function ConexionesPage() {
  const { user, markNotificationsForLinkAsRead } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    isValidTab(initialTab) ? initialTab : "conectadas"
  );
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [connectionToRemove, setConnectionToRemove] =
    useState<UserConnection | null>(null);

  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: CONNECTION_OVERVIEW_QUERY_KEY,
    queryFn: getConnectionOverview,
  });

  useEffect(() => {
    void Promise.all([
      markNotificationsForLinkAsRead("/conexiones"),
      markNotificationsForLinkAsRead("/conexiones?tab=recibidas"),
    ]).catch(() => {});
  }, [markNotificationsForLinkAsRead]);

  const accepted = overview?.accepted ?? [];
  const received = overview?.received ?? [];
  const sent = overview?.sent ?? [];

  const tabs: Array<{
    key: Tab;
    label: string;
    count: number;
    icon: typeof UsersRound;
  }> = [
    {
      key: "conectadas",
      label: "Conectadas",
      count: accepted.length,
      icon: UsersRound,
    },
    {
      key: "recibidas",
      label: "Recibidas",
      count: received.length,
      icon: Inbox,
    },
    {
      key: "enviadas",
      label: "Enviadas",
      count: sent.length,
      icon: Send,
    },
  ];

  const activeItems =
    tab === "recibidas" ? received : tab === "enviadas" ? sent : accepted;

  function setOverview(updater: (current: UserConnectionOverview) => UserConnectionOverview) {
    queryClient.setQueryData<UserConnectionOverview>(
      CONNECTION_OVERVIEW_QUERY_KEY,
      (current) => (current ? updater(current) : current)
    );
  }

  function syncPerson(
    connection: UserConnection,
    status: "NONE" | "ACCEPTED"
  ) {
    if (!user) return;
    const person = otherParticipant(connection, user.id);
    setCachedProfileConnection(
      queryClient,
      person.id,
      status,
      status === "ACCEPTED" ? connection.id : null
    );
  }

  async function handleAccept(connection: UserConnection) {
    if (actioningId !== null) return;
    setActioningId(connection.id);
    setActionError("");

    try {
      const acceptedConnection = await acceptConnection(connection.id);
      setOverview((current) => ({
        ...current,
        received: current.received.filter((item) => item.id !== connection.id),
        accepted: [
          acceptedConnection,
          ...current.accepted.filter((item) => item.id !== connection.id),
        ],
      }));
      syncPerson(acceptedConnection, "ACCEPTED");
      refreshConnectionQueries(queryClient);
      router.push(`/mensajes/${connection.id}`);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(
          error,
          "No hemos podido aceptar la solicitud. Inténtalo de nuevo."
        )
      );
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(connection: UserConnection) {
    if (actioningId !== null) return;
    setActioningId(connection.id);
    setActionError("");

    try {
      await rejectConnection(connection.id);
      setOverview((current) => ({
        ...current,
        received: current.received.filter((item) => item.id !== connection.id),
      }));
      syncPerson(connection, "NONE");
      refreshConnectionQueries(queryClient);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(error, "No hemos podido rechazar la solicitud.")
      );
    } finally {
      setActioningId(null);
    }
  }

  async function handleCancel(connection: UserConnection) {
    if (actioningId !== null) return;
    setActioningId(connection.id);
    setActionError("");

    try {
      await cancelConnection(connection.id);
      setOverview((current) => ({
        ...current,
        sent: current.sent.filter((item) => item.id !== connection.id),
      }));
      syncPerson(connection, "NONE");
      refreshConnectionQueries(queryClient);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(error, "No hemos podido cancelar la solicitud.")
      );
    } finally {
      setActioningId(null);
    }
  }

  async function handleRemove() {
    const connection = connectionToRemove;
    if (!connection || actioningId !== null) return;
    setActioningId(connection.id);
    setActionError("");

    try {
      await deleteConnection(connection.id);
      setOverview((current) => ({
        ...current,
        accepted: current.accepted.filter((item) => item.id !== connection.id),
      }));
      syncPerson(connection, "NONE");
      setConnectionToRemove(null);
      refreshConnectionQueries(queryClient);
    } catch (error) {
      setActionError(
        getCommunityErrorMessage(error, "No hemos podido eliminar la conexión.")
      );
    } finally {
      setActioningId(null);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-6xl pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </button>

        <header className="flex items-end justify-between gap-6 border-b border-black/[0.07] pb-6 sm:pb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#66736c]">Tu red CoFlow</p>
            <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.05em] text-[#17392c] sm:text-[48px]">
              Conexiones
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#68756e] sm:text-base">
              Gestiona tus conversaciones y decide con quién quieres conectar.
            </p>
          </div>

          <Link
            href="/usuarios"
            className="hidden h-12 shrink-0 items-center gap-2 rounded-[13px] bg-[#183c2d] px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98] sm:inline-flex"
          >
            <UserRound className="h-4 w-4" aria-hidden="true" />
            Encontrar personas
          </Link>
        </header>

        <div
          role="tablist"
          aria-label="Secciones de conexiones"
          className="mt-5 grid grid-cols-3 gap-1 rounded-[16px] bg-[#e9eeeb] p-1"
        >
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(item.key);
                  setActionError("");
                }}
                className={`flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-[12px] px-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] sm:gap-2 sm:text-sm ${
                  active
                    ? "bg-white text-[#17392c] shadow-[0_3px_12px_rgba(20,42,32,.08)] ring-1 ring-black/[0.035]"
                    : "text-[#66736c] hover:text-[#17392c]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
                <span
                  className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
                    active ? "bg-[#183c2d] text-white" : "bg-black/[0.05] text-secondary"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {actionError && (
          <p
            role="alert"
            className="mt-5 rounded-14 border border-red-200 bg-white p-3 text-center text-sm font-semibold text-red-700 shadow-soft"
          >
            {actionError}
          </p>
        )}

        <section className="mt-6" aria-live="polite">
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index} className="h-44" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              title="No hemos podido cargar tus conexiones"
              description="Ha fallado la sincronización con CoFlow. Inténtalo de nuevo."
              action={
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-bold text-white"
                >
                  Reintentar
                </button>
              }
            />
          ) : activeItems.length === 0 ? (
            <ConnectionsEmptyState tab={tab} />
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                  duration: MOTION_DURATION.fast,
                  ease: MOTION_EASE.out,
                }}
                className="grid gap-4 md:grid-cols-2"
              >
                {activeItems.map((connection) => {
                  const person = user
                    ? otherParticipant(connection, user.id)
                    : connection.requester;
                  const busy = actioningId === connection.id;

                  if (tab === "recibidas") {
                    return (
                      <ConnectionCard
                        key={connection.id}
                        person={person}
                        meta={`Recibida ${formatRelativeDate(connection.created_at)}`}
                        badge="Quiere conectar"
                      >
                        <button
                          type="button"
                          onClick={() => handleAccept(connection)}
                          disabled={busy}
                          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#183c2d] px-4 text-sm font-semibold text-white disabled:opacity-55"
                        >
                          {busy ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" aria-hidden="true" />
                          )}
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(connection)}
                          disabled={busy}
                          aria-label={`Rechazar solicitud de ${person.first_name}`}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#f0f2f0] text-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-55"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </ConnectionCard>
                    );
                  }

                  if (tab === "enviadas") {
                    return (
                      <ConnectionCard
                        key={connection.id}
                        person={person}
                        meta={`Enviada ${formatRelativeDate(connection.created_at)}`}
                        badge="Esperando respuesta"
                      >
                        <span className="flex h-11 flex-1 items-center gap-2 text-sm font-semibold text-secondary">
                          <Clock3 className="h-4 w-4" aria-hidden="true" />
                          Pendiente
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCancel(connection)}
                          disabled={busy}
                          className="flex h-11 items-center justify-center px-3 text-xs font-semibold text-[#66736c] underline decoration-black/15 underline-offset-4 transition-colors hover:text-[#17392c] disabled:opacity-55"
                        >
                          {busy ? "Cancelando…" : "Cancelar"}
                        </button>
                      </ConnectionCard>
                    );
                  }

                  return (
                    <ConnectionCard
                      key={connection.id}
                      person={person}
                      meta={
                        connection.responded_at
                          ? `Conectados ${formatRelativeDate(connection.responded_at)}`
                          : "Ya podéis hablar"
                      }
                      badge="Conectados"
                    >
                      <Link
                        href={`/mensajes/${connection.id}`}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#183c2d] px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Enviar mensaje
                      </Link>
                      <button
                        type="button"
                        onClick={() => setConnectionToRemove(connection)}
                        aria-label={`Eliminar conexión con ${person.first_name}`}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#f0f2f0] text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </ConnectionCard>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        <Link
          href="/usuarios"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#183c2d] px-5 text-sm font-semibold text-white transition-transform active:scale-[0.98] sm:hidden"
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
          Encontrar personas
        </Link>

        <AnimatePresence>
          {connectionToRemove && (
            <ConfirmDialog
              title={`¿Eliminar tu conexión con ${otherParticipant(connectionToRemove, user?.id ?? "").first_name}?`}
              description="La conversación dejará de estar disponible para los dos. Podréis volver a enviar una solicitud más adelante."
              confirmLabel="Eliminar conexión"
              destructive
              pending={actioningId === connectionToRemove.id}
              onConfirm={handleRemove}
              onClose={() => setConnectionToRemove(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function ConnectionCard({
  person,
  meta,
  badge,
  children,
}: {
  person: UserConnectionParticipant;
  meta: string;
  badge: string;
  children: React.ReactNode;
}) {
  const fullName = `${person.first_name} ${person.last_name}`.trim();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
      className="flex min-h-44 flex-col rounded-[22px] border border-black/[0.065] bg-[#fbfcfa] p-4 shadow-[0_8px_28px_rgba(20,42,32,.045)] transition-shadow hover:shadow-[0_16px_38px_rgba(20,42,32,.075)] sm:p-5"
    >
      <Link
        href={`/personas/${person.id}`}
        transitionTypes={["nav-forward"]}
        className="flex min-h-14 items-center gap-3 rounded-14 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
      >
        <ViewTransition name={detailTransitionName("person", person.id)} share="coflow-detail-morph">
        <div className="flex w-full min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <UserAvatar
            firstName={person.first_name}
            lastName={person.last_name}
            userId={person.id}
            imageUrl={person.avatar_url}
            size="lg"
          />
          {badge === "Conectados" && (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-emerald-600" />
          )}
        </div>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold tracking-[-0.025em] text-[#17392c]">
            {fullName || "Persona de CoFlow"}
          </span>
          <span className="mt-1 block text-xs text-secondary">{meta}</span>
        </span>

        <span className="shrink-0 rounded-full bg-[#e9efeb] px-2.5 py-1.5 text-[10px] font-semibold text-[#40544a]">
          {badge}
        </span>
        </div>
        </ViewTransition>
      </Link>

      <div className="mt-auto flex items-center gap-2 border-t border-black/[0.06] pt-4">
        {children}
      </div>
    </motion.article>
  );
}

function ConnectionsEmptyState({ tab }: { tab: Tab }) {
  if (tab === "recibidas") {
    return (
      <EmptyState
        variant="invitations"
        title="No tienes solicitudes recibidas"
        description="Cuando alguien quiera conectar contigo, podrás responder desde aquí."
      />
    );
  }

  if (tab === "enviadas") {
    return (
      <EmptyState
        variant="invitations"
        title="No tienes solicitudes enviadas"
        description="Explora personas y conecta con quienes encajen contigo."
        action={
          <Link
            href="/usuarios"
            className="flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-bold text-white"
          >
            Explorar personas
          </Link>
        }
      />
    );
  }

  return (
    <EmptyState
      variant="messages"
      title="Aún no tienes conexiones"
      description="Cuando alguien acepte una solicitud, podréis empezar a hablar con tranquilidad."
      action={
        <Link
          href="/usuarios"
          className="flex h-11 items-center rounded-full bg-foreground px-5 text-sm font-bold text-white"
        >
          Encontrar personas
        </Link>
      }
    />
  );
}

function otherParticipant(connection: UserConnection, currentUserId: string) {
  return connection.requester.id === currentUserId
    ? connection.recipient
    : connection.requester;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(elapsed / 60_000));

  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;

  return `el ${new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date)}`;
}
