"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import SkeletonCard from "@/components/ui/SkeletonCard";
import EmptyContentState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/notification";

type Category = "ALL" | "INVITATIONS" | "MESSAGES" | "ACTIVITY" | "INFO";
type DateGroup = "HOY" | "SEMANA" | "ANTERIORES";

const categories: Array<{ value: Category; label: string; icon: ReactNode }> = [
  { value: "ALL", label: "Todas", icon: <BellIcon /> },
  { value: "INVITATIONS", label: "Invitaciones", icon: <MailIcon /> },
  { value: "MESSAGES", label: "Mensajes", icon: <MessageIcon /> },
  { value: "ACTIVITY", label: "Actividad", icon: <PeopleIcon /> },
  { value: "INFO", label: "Avisos", icon: <InfoIcon /> },
];

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    notificationsLoading,
    unreadCount,
    refreshUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAuth();
  const [category, setCategory] = useState<Category>("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void refreshUnreadCount().then((success) => {
      if (!active) return;
      if (!success) {
        setError("No pudimos cargar tus notificaciones.");
      }
    });

    return () => {
      active = false;
    };
  }, [refreshUnreadCount]);

  const filtered = useMemo(
    () =>
      notifications.filter(
        (item) => category === "ALL" || getCategory(item.type) === category
      ),
    [notifications, category]
  );

  const grouped = useMemo(() => {
    const groups: Record<DateGroup, AppNotification[]> = {
      HOY: [],
      SEMANA: [],
      ANTERIORES: [],
    };
    filtered.forEach((notification) => groups[getDateGroup(notification.created_at)].push(notification));
    return groups;
  }, [filtered]);

  async function reload() {
    setError("");
    const success = await refreshUnreadCount();
    if (!success) setError("No pudimos cargar tus notificaciones.");
  }

  function openNotification(notification: AppNotification) {
    if (!notification.is_read) {
      void markNotificationAsRead(notification.id).catch(() => {});
    }
    if (notification.link) router.push(notification.link);
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver"
              className="flex h-11 w-11 shrink-0 items-center justify-start text-[#222222] md:hidden"
            >
              <ArrowLeftIcon />
            </button>
            <h1 className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">
              Notificaciones
            </h1>
            {unreadCount > 0 && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary-dark">{unreadCount} nuevas</span>}
          </div>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Solicitudes, mensajes y cambios importantes, en un solo lugar.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {unreadCount > 0 && <button type="button" onClick={() => void markAllNotificationsAsRead().catch(() => setError("No pudimos marcar las notificaciones como leídas."))} className="flex h-11 items-center rounded-full px-3 text-xs font-bold text-primary-dark transition hover:bg-[#eef2ef] sm:px-4"><span className="sm:hidden">Leer todas</span><span className="hidden sm:inline">Marcar todas como leídas</span></button>}
          <Link href="/ajustes" aria-label="Ajustes de notificaciones" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/[0.07] bg-[#fbfcfa] text-brand-dark transition hover:bg-[#eef2ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><SettingsIcon /></Link>
        </div>
      </header>

      <nav
        aria-label="Categorías de notificación"
        className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((item) => {
          const active = category === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(item.value)}
              aria-pressed={active}
              className={cn(
                "flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
                active
                  ? "border-brand-dark bg-brand-dark text-white"
                  : "border-black/[0.07] bg-[#fbfcfa] text-secondary hover:text-brand-dark"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {notificationsLoading ? (
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState
          className="mt-8"
          title="No se pudieron cargar"
          description={error}
          onRetry={() => void reload()}
        />
      ) : filtered.length === 0 ? (
        <EmptyContentState
          className="mt-10"
          variant="notifications"
          title="Todo al día"
          description="No tienes notificaciones en esta categoría."
        />
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }} className="mt-7 space-y-7">
          {(["HOY", "SEMANA", "ANTERIORES"] as DateGroup[]).map((group) => grouped[group].length > 0 && (
            <section key={group} aria-labelledby={`notification-group-${group}`}>
              <div className="mb-2 flex items-center gap-3 px-1">
                <h2 id={`notification-group-${group}`} className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">{getDateGroupLabel(group)}</h2>
                <span className="h-px flex-1 bg-black/[0.06]" />
              </div>
              <ul className="overflow-hidden rounded-[22px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(20,42,32,.04)]">
                <AnimatePresence initial={false}>
                  {grouped[group].map((notification) => (
                    <motion.li key={notification.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.18, ease: "easeOut" }} className="border-b border-black/[0.055] last:border-b-0">
                      <NotificationCard notification={notification} wasUnread={!notification.is_read} onOpen={openNotification} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </motion.div>
      )}

      <Link
        href="/ajustes"
        className="mt-8 flex min-h-18 items-center gap-4 rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] p-4 transition hover:bg-[#f5f7f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f7f7f7] text-[#222222]">
          <BellIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#222222]">
            Decide qué quieres recibir
          </p>
          <p className="mt-0.5 text-xs leading-5 text-[#717171]">
            Gestiona tus preferencias de notificación.
          </p>
        </div>
        <ChevronIcon />
      </Link>
    </div>
  );
}

function NotificationCard({
  notification,
  wasUnread,
  onOpen,
}: {
  notification: AppNotification;
  wasUnread: boolean;
  onOpen: (notification: AppNotification) => void;
}) {
  const actionLabel = getActionLabel(notification.type);
  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={cn("group relative flex min-h-24 w-full items-start gap-3.5 p-4 text-left transition hover:bg-[#f3f6f3] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:p-5", wasUnread && "bg-[#f2f7f4]")}
    >
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", wasUnread ? "bg-primary text-white" : "bg-[#e9eeea] text-primary-dark")}>
        {getTypeIcon(notification.type)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={cn("text-sm leading-5 text-brand-dark", wasUnread ? "font-bold" : "font-semibold")}>
            {notification.title}
          </span>
          <time className="shrink-0 text-[11px] font-medium text-[#717171]">
            {formatNotificationDate(notification.created_at)}
          </time>
        </span>
        <span className="mt-1 block text-xs leading-5 text-[#717171]">
          {notification.message}
        </span>
        {notification.link && (
          <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-primary-dark">
            {actionLabel} <ChevronIcon />
          </span>
        )}
      </span>
      {wasUnread && <span className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary sm:right-5" aria-label="Nueva" />}
    </button>
  );
}

function getDateGroup(value: string): DateGroup {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ANTERIORES";
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.floor((startOfToday - startOfDate) / 86_400_000);
  if (days <= 0) return "HOY";
  if (days < 7) return "SEMANA";
  return "ANTERIORES";
}

function getDateGroupLabel(group: DateGroup) {
  if (group === "HOY") return "Hoy";
  if (group === "SEMANA") return "Esta semana";
  return "Anteriores";
}

function getActionLabel(type: NotificationType) {
  if (type === "PRIVATE_MESSAGE_RECEIVED") return "Abrir conversación";
  if (type === "CONNECTION_REQUEST_RECEIVED") return "Responder solicitud";
  if (type === "COMMUNITY_INVITATION_RECEIVED") return "Ver invitación";
  if (type.startsWith("COMMUNITY_APPLICATION")) return "Ver solicitud";
  if (type === "CONNECTION_REQUEST_ACCEPTED") return "Ver conexión";
  return "Ver detalle";
}

function getCategory(type: NotificationType): Exclude<Category, "ALL"> {
  if (type === "PRIVATE_MESSAGE_RECEIVED") return "MESSAGES";
  if (
    type.startsWith("COMMUNITY_APPLICATION") ||
    type === "COMMUNITY_INVITATION_RECEIVED"
  ) {
    return "INVITATIONS";
  }
  if (
    type === "CONNECTION_REQUEST_RECEIVED" ||
    type === "CONNECTION_REQUEST_ACCEPTED" ||
    type === "COMMUNITY_MEMBER_JOINED" ||
    type === "COMMUNITY_MEMBER_LEFT" ||
    type === "COMMUNITY_MEMBER_REMOVED" ||
    type === "COMMUNITY_OWNERSHIP_TRANSFERRED" ||
    type === "COMMUNITY_INVITATION_ACCEPTED"
  ) {
    return "ACTIVITY";
  }
  return "INFO";
}

function getTypeIcon(type: NotificationType) {
  const category = getCategory(type);
  if (category === "MESSAGES") return <MessageIcon />;
  if (category === "INVITATIONS") return <MailIcon />;
  if (category === "ACTIVITY") return <PeopleIcon />;
  return <InfoIcon />;
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "Ahora";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} h`;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
function BellIcon() { return <SvgIcon><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21h4" /></SvgIcon>; }
function MailIcon() { return <SvgIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></SvgIcon>; }
function MessageIcon() { return <SvgIcon><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 10h8M8 14h5" /></SvgIcon>; }
function PeopleIcon() { return <SvgIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></SvgIcon>; }
function InfoIcon() { return <SvgIcon><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></SvgIcon>; }
function SettingsIcon() { return <SvgIcon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></SvgIcon>; }
function ArrowLeftIcon() { return <SvgIcon><path d="M19 12H5M11 18l-6-6 6-6" /></SvgIcon>; }
function ChevronIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>; }
