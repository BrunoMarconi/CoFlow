"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import type { AppNotification } from "@/types/notification";
import Icon3D from "@/components/layout/Icon3D";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SPRING,
  MOTION_STAGGER_TIGHT,
} from "@/lib/motionTokens";

// Mismo patrón de bottom sheet que PersonPreviewPanel (drag="y" +
// estos mismos umbrales de cierre) — se reutiliza aquí tal cual en
// vez de inventar uno nuevo para móvil.
const DRAG_CLOSE_OFFSET = 120;
const DRAG_CLOSE_VELOCITY = 600;

const BELL_SHAKE = { rotate: [0, -4, 4, 0] };

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: MOTION_STAGGER_TIGHT } },
};

const listItem = {
  hidden: { opacity: 0, y: 4 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.out },
  },
};

export default function NotificationBell() {
  const router = useRouter();
  const { unreadCount, refreshUnreadCount } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellControls = useAnimationControls();
  const previousUnreadRef = useRef(unreadCount);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // En móvil el panel se portalea a document.body (ver más abajo),
      // así que ya no cuelga de containerRef — hay que comprobar los
      // dos.
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;

      setOpen(false);
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

  // Nueva notificación en tiempo real (refreshUnreadCount ya hace
  // polling en AuthProvider): si el contador sube, la campana hace un
  // pequeño gesto — nunca abre el panel solo, eso lo decide el usuario.
  useEffect(() => {
    if (unreadCount > previousUnreadRef.current && !prefersReducedMotion) {
      bellControls.start(BELL_SHAKE, {
        duration: MOTION_DURATION.slow,
        ease: MOTION_EASE.out,
      });
    }

    previousUnreadRef.current = unreadCount;
  }, [unreadCount, prefersReducedMotion, bellControls]);

  function handleTap() {
    setOpen((current) => !current);

    if (!prefersReducedMotion) {
      bellControls.start(BELL_SHAKE, {
        duration: MOTION_DURATION.slow,
        ease: MOTION_EASE.out,
      });
    }
  }

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

  const hasUnread = notifications.some((item) => !item.is_read);

  const panelTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : isDesktop
      ? { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }
      : MOTION_SPRING.gentle;

  const panelInitial = prefersReducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.96, y: -6 }
      : { opacity: 0, y: 40, scale: 0.98 };

  const panelAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : isDesktop
      ? { opacity: 1, scale: 1, y: 0 }
      : { opacity: 1, y: 0, scale: 1 };

  const panelExit = prefersReducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.97, y: -4 }
      : { opacity: 0, y: 40, scale: 0.98 };

  const canDrag = !prefersReducedMotion && !isDesktop;

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) {
    if (
      info.offset.y > DRAG_CLOSE_OFFSET ||
      info.velocity.y > DRAG_CLOSE_VELOCITY
    ) {
      setOpen(false);
    }
  }

  const listContent = loading ? (
    <p className="p-6 text-center text-sm text-muted">Cargando...</p>
  ) : error ? (
    <p className="p-6 text-center text-sm font-semibold text-red-600">
      {error}
    </p>
  ) : notifications.length === 0 ? (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION_DURATION.normal }}
      className="p-6 text-center text-sm text-muted"
    >
      Todavía no tienes notificaciones.
    </motion.p>
  ) : (
    <motion.ul variants={listContainer} initial="hidden" animate="show">
      {notifications.map((notification) => (
        <motion.li key={notification.id} variants={listItem}>
          <motion.button
            type="button"
            onClick={() => handleOpenNotification(notification)}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: MOTION_DURATION.fast }}
            className={`flex w-full flex-col items-start gap-1 border-b border-border px-4 py-3 text-left transition-colors duration-300 hover:bg-surface-soft ${
              notification.is_read ? "bg-transparent" : "bg-mint-50"
            }`}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <p
                className={`text-sm text-brand-dark ${
                  notification.is_read ? "font-semibold" : "font-bold"
                }`}
              >
                {notification.title}
              </p>

              <AnimatePresence>
                {!notification.is_read && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: MOTION_DURATION.fast }}
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                  />
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs leading-5 text-secondary">
              {notification.message}
            </p>

            <p className="text-[11px] text-muted">
              {formatNotificationDate(notification.created_at)}
            </p>
          </motion.button>
        </motion.li>
      ))}
    </motion.ul>
  );

  // Siempre se portalea a document.body y siempre se posiciona con
  // fixed (nunca absolute relativo a containerRef): el botón vive
  // dentro del <header> de Navbar, envuelto además en un div
  // "rounded-full ... backdrop-blur-xl" — ese backdrop-filter crea un
  // containing block nuevo para position:fixed (rompía el bottom
  // sheet móvil) y, sin portal, ese mismo wrapper recortaba el panel
  // de escritorio en anchos intermedios (~640-768px, donde el resto
  // de la app ya se considera "móvil" pero este breakpoint sm: no).
  const panel = (
    <>
      {!isDesktop && (
        <motion.button
          type="button"
          aria-label="Cerrar notificaciones"
          onClick={() => setOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.normal }}
          className="fixed inset-0 z-(--z-modal) bg-black/20"
        />
      )}

      <motion.div
        ref={panelRef}
        initial={panelInitial}
        animate={panelAnimate}
        exit={panelExit}
        transition={panelTransition}
        drag={canDrag ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        style={{
          willChange: "transform",
          transformOrigin: isDesktop ? "top right" : undefined,
        }}
        className="fixed inset-x-0 bottom-0 z-(--z-modal) max-h-[75dvh] overflow-hidden rounded-t-24 border border-border bg-surface shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[calc(var(--safe-top)+4.5rem)] sm:w-96 sm:rounded-18 sm:shadow-soft"
      >
        {!isDesktop && (
          <div className="flex shrink-0 justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-border" />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <motion.div
              layoutId={open ? "notification-bell-icon" : undefined}
              transition={{ layout: MOTION_SPRING.gentle }}
            >
              <Icon3D src="/icons/3d/bell.png" active size={20} />
            </motion.div>

            <p className="text-sm font-bold text-brand-dark">
              Notificaciones
            </p>
          </div>

          {hasUnread && (
            <motion.button
              type="button"
              onClick={handleMarkAllRead}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: MOTION_DURATION.fast }}
              className="text-xs font-bold text-primary-dark hover:text-brand-dark"
            >
              Marcar todas como leídas
            </motion.button>
          )}
        </div>

        <div className="max-h-[calc(75dvh-3.5rem)] overflow-y-auto sm:max-h-96">
          {listContent}
        </div>
      </motion.div>
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        onClick={handleTap}
        aria-label="Notificaciones"
        aria-expanded={open}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-180 hover:bg-surface-soft"
      >
        <motion.div
          layoutId={open ? undefined : "notification-bell-icon"}
          animate={bellControls}
          transition={{ layout: MOTION_SPRING.gentle }}
        >
          <Icon3D src="/icons/3d/bell.png" active size={28} />
        </motion.div>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={MOTION_SPRING.snappy}
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={unreadCount}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: [1.2, 1] }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: MOTION_DURATION.fast }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && createPortal(panel, document.body)}
      </AnimatePresence>
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
