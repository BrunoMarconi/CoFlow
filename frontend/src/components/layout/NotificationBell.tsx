"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import type { AppNotification } from "@/types/notification";
import Icon3D from "@/components/layout/Icon3D";

export default function NotificationBell() {
  const router = useRouter();
  const { unreadCount, refreshUnreadCount } = useAuth();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let active = true;

    function fetchNotifications() {
      setLoading(true);
      setError("");

      getNotifications({ limit: 20 })
        .then((data) => {
          if (active) setNotifications(data);
        })
        .catch(() => {
          if (active) setError("No pudimos cargar tus notificaciones.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    fetchNotifications();

    return () => {
      active = false;
    };
  }, [open]);

  async function handleOpenNotification(notification: AppNotification) {
    setOpen(false);

    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        await refreshUnreadCount();
      } catch {
        // Si falla el marcado, seguimos navegando de todas formas.
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
      await refreshUnreadCount();
    } catch {
      setError("No pudimos marcar las notificaciones como leídas.");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notificaciones"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-surface-soft active:scale-95"
      >
        <Icon3D src="/icons/3d/bell.png" active size={28} />

        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[calc(var(--safe-top)+4.5rem)] z-(--z-modal) max-h-[70dvh] overflow-hidden rounded-18 border border-border bg-surface shadow-soft sm:absolute sm:inset-x-auto sm:right-0 sm:top-16 sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-brand-dark">
              Notificaciones
            </p>

            {notifications.some((item) => !item.is_read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-primary-dark hover:text-brand-dark"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[calc(70dvh-3rem)] overflow-y-auto sm:max-h-96">
            {loading ? (
              <p className="p-6 text-center text-sm text-muted">
                Cargando...
              </p>
            ) : error ? (
              <p className="p-6 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">
                Todavía no tienes notificaciones.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={`flex w-full flex-col items-start gap-1 border-b border-border px-4 py-3 text-left transition hover:bg-surface-soft ${
                        notification.is_read ? "" : "bg-mint-50"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-sm font-bold text-brand-dark">
                          {notification.title}
                        </p>

                        {!notification.is_read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>

                      <p className="text-xs leading-5 text-secondary">
                        {notification.message}
                      </p>

                      <p className="text-[11px] text-muted">
                        {formatNotificationDate(notification.created_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

