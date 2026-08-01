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
        className="relative flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-[#163B2E] active:scale-95"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4rem)] z-50 max-h-[70dvh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-[#163B2E]">
              Notificaciones
            </p>

            {notifications.some((item) => !item.is_read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-green-700 hover:text-green-800"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-[calc(70dvh-3rem)] overflow-y-auto sm:max-h-96">
            {loading ? (
              <p className="p-6 text-center text-sm text-gray-400">
                Cargando...
              </p>
            ) : error ? (
              <p className="p-6 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">
                Todavía no tienes notificaciones.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className={`flex w-full flex-col items-start gap-1 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${
                        notification.is_read ? "" : "bg-green-50/50"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-sm font-bold text-[#163B2E]">
                          {notification.title}
                        </p>

                        {!notification.is_read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        )}
                      </div>

                      <p className="text-xs leading-5 text-gray-500">
                        {notification.message}
                      </p>

                      <p className="text-[11px] text-gray-400">
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

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 6 2 6.5H4C4.5 14 6 12 6 8Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
