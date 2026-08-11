"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/notification";

type Category = "ALL" | "INVITATIONS" | "MESSAGES" | "ACTIVITY" | "INFO";

const categories: Array<{ value: Category; label: string; icon: ReactNode }> = [
  { value: "ALL", label: "Todas", icon: <BellIcon /> },
  { value: "INVITATIONS", label: "Invitaciones", icon: <MailIcon /> },
  { value: "MESSAGES", label: "Mensajes", icon: <MessageIcon /> },
  { value: "ACTIVITY", label: "Actividad", icon: <PeopleIcon /> },
  { value: "INFO", label: "Avisos", icon: <InfoIcon /> },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { refreshUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [category, setCategory] = useState<Category>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getNotifications({ limit: 100 })
      .then(setNotifications)
      .catch(() => setError("No pudimos cargar tus notificaciones."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => notifications.filter((item) => category === "ALL" || getCategory(item.type) === category),
    [notifications, category]
  );
  const unread = filtered.filter((item) => !item.is_read);
  const previous = filtered.filter((item) => item.is_read);
  const totalUnread = notifications.filter((item) => !item.is_read).length;

  async function openNotification(notification: AppNotification) {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
        await refreshUnreadCount();
      } catch {
        // La navegación sigue disponible aunque falle el marcado.
      }
    }
    if (notification.link) router.push(notification.link);
  }

  async function markAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      await refreshUnreadCount();
    } catch {
      setError("No pudimos marcar las notificaciones como leídas.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl pb-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-10 w-10 items-center justify-start text-brand-dark md:hidden"><ArrowLeftIcon /></button>
            <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">Notificaciones</h1>
          </div>
          <p className="mt-2 text-sm text-muted">Aquí tienes todo lo importante de tu actividad.</p>
        </div>

        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <button type="button" onClick={markAllRead} className="hidden text-sm font-bold text-primary hover:text-primary-hover sm:block">Marcar todas como leídas</button>
          )}
          <Link href="/ajustes" aria-label="Ajustes de notificaciones" className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-secondary hover:bg-surface-soft"><SettingsIcon /></Link>
        </div>
      </header>

      <nav aria-label="Categorías de notificación" className="mt-6 flex overflow-x-auto border-b border-border">
        {categories.map((item) => {
          const count = notifications.filter((notification) => !notification.is_read && (item.value === "ALL" || getCategory(notification.type) === item.value)).length;
          return (
            <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={cn("relative flex min-w-16 shrink-0 flex-1 items-center justify-center gap-2 px-3 pb-3 pt-2 text-xs font-bold text-muted transition", category === item.value && "text-primary-dark")}>
              {item.icon}<span className="hidden sm:inline">{item.label}</span>
              {count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">{count > 9 ? "9+" : count}</span>}
              {category === item.value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>

      {totalUnread > 0 && <button type="button" onClick={markAllRead} className="mt-4 text-sm font-bold text-primary sm:hidden">Marcar todas como leídas</button>}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center"><Spinner /></div>
      ) : error ? (
        <p className="mt-8 rounded-18 border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 space-y-8">
          {unread.length > 0 && <NotificationGroup title="Nuevas" notifications={unread} onOpen={openNotification} prominent />}
          {previous.length > 0 && <NotificationGroup title="Anteriores" notifications={previous} onOpen={openNotification} />}
        </div>
      )}

      <Link href="/ajustes" className="mt-8 flex items-center gap-4 rounded-18 bg-mint-50 p-4 text-primary-dark hover:bg-mint-100">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"><BellIcon /></span>
        <div className="flex-1"><p className="text-sm font-bold">¿No quieres perderte nada?</p><p className="mt-0.5 text-xs text-secondary">Gestiona tus preferencias de notificación.</p></div>
        <ChevronIcon />
      </Link>
    </div>
  );
}

function NotificationGroup({ title, notifications, onOpen, prominent = false }: { title: string; notifications: AppNotification[]; onOpen: (notification: AppNotification) => void; prominent?: boolean }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-base font-bold text-foreground">{prominent && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}{title}</h2>
      <div className={cn("mt-3 overflow-hidden rounded-18 border border-border bg-surface", prominent ? "grid gap-3 border-0 bg-transparent md:grid-cols-2" : "divide-y divide-border")}>
        {notifications.map((notification) => (
          <button key={notification.id} type="button" onClick={() => onOpen(notification)} className={cn("flex w-full items-start gap-3 p-4 text-left transition hover:bg-surface-soft", prominent && "rounded-18 border border-border bg-surface shadow-soft")}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">{getTypeIcon(notification.type)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold leading-5 text-brand-dark">{notification.title}</p><time className="shrink-0 text-[10px] text-muted">{formatNotificationDate(notification.created_at)}</time></div>
              <p className="mt-1 text-xs leading-5 text-secondary">{notification.message}</p>
              {notification.link && <span className="mt-3 inline-flex rounded-10 border border-primary/40 px-3 py-1.5 text-xs font-bold text-primary-dark">Ver detalle</span>}
            </div>
            {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return <div className="mt-10 rounded-24 border border-dashed border-border p-10 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center text-primary"><BellIcon /></span><p className="mt-4 text-base font-bold text-brand-dark">Todo al día</p><p className="mt-1 text-sm text-muted">No tienes notificaciones en esta categoría.</p></div>;
}

function getCategory(type: NotificationType): Exclude<Category, "ALL"> {
  if (type === "PRIVATE_MESSAGE_RECEIVED") return "MESSAGES";
  if (type.startsWith("COMMUNITY_APPLICATION")) return "INVITATIONS";
  if (type === "CONNECTION_REQUEST_RECEIVED" || type === "CONNECTION_REQUEST_ACCEPTED" || type === "COMMUNITY_MEMBER_JOINED" || type === "COMMUNITY_MEMBER_LEFT" || type === "COMMUNITY_INVITATION_ACCEPTED") return "ACTIVITY";
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
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}

function SvgIcon({ children }: { children: ReactNode }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{children}</svg>; }
function BellIcon() { return <SvgIcon><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21h4" /></SvgIcon>; }
function MailIcon() { return <SvgIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></SvgIcon>; }
function MessageIcon() { return <SvgIcon><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 10h8M8 14h5" /></SvgIcon>; }
function PeopleIcon() { return <SvgIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></SvgIcon>; }
function InfoIcon() { return <SvgIcon><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></SvgIcon>; }
function SettingsIcon() { return <SvgIcon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></SvgIcon>; }
function ArrowLeftIcon() { return <SvgIcon><path d="M19 12H5M11 18l-6-6 6-6" /></SvgIcon>; }
function ChevronIcon() { return <SvgIcon><path d="m9 6 6 6-6 6" /></SvgIcon>; }
