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
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { AppNotification } from "@/types/notification";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SPRING,
  MOTION_STAGGER_CHILDREN,
} from "@/lib/motionTokens";

// Mismo patrón de bottom sheet que PersonPreviewPanel (drag="y" +
// estos mismos umbrales de cierre) — se reutiliza aquí tal cual en
// vez de inventar uno nuevo para móvil.
const DRAG_CLOSE_OFFSET = 120;
const DRAG_CLOSE_VELOCITY = 600;

/* Repique de campana: la amplitud decae en cada oscilación, como algo
 * que se ha golpeado y se va parando. El giro pivota desde arriba (ver
 * `origin-top` en el icono) porque una campana cuelga de su soporte —
 * girando desde el centro parecía un icono temblando, no una campana. */
const BELL_SHAKE = { rotate: [0, -13, 10, -7, 4, -2, 0] };
const BELL_SHAKE_DURATION = 0.62;

/** Anillo que sale del contador al llegar algo nuevo. */
const BADGE_PING = { scale: [1, 2.3], opacity: [0.55, 0] };

const listContainer = {
  hidden: {},
  // MOTION_STAGGER_CHILDREN es el token pensado para listas de info
  // dentro de un panel; el TIGHT que había aquí es para elementos que
  // nacen de algo en movimiento y apenas llegaba a percibirse.
  show: { transition: { staggerChildren: MOTION_STAGGER_CHILDREN } },
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out },
  },
};

export default function NotificationBell() {
  const router = useRouter();
  const {
    unreadCount,
    notifications,
    notificationsLoading,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useAuth();
  const { isOwnerMode } = useOwnerMode();
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  // document solo existe en cliente — el portal se crea una vez
  // montado para no reventar el render en servidor.
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bellControls = useAnimationControls();
  const pingControls = useAnimationControls();
  const previousUnreadRef = useRef(isOwnerMode ? 0 : unreadCount);

  useEffect(() => {
    // Patrón estándar de "solo en cliente" para poder llamar a
    // createPortal — no hay forma honesta de saber esto antes de
    // montar (no sincroniza con ningún sistema externo real).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    window.requestAnimationFrame(() => panelRef.current?.focus());

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      // En móvil el panel se portalea a document.body (ver más abajo),
      // así que ya no cuelga de containerRef — hay que comprobar los
      // dos.
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;

      setOpen(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Nueva notificación en tiempo real (refreshUnreadCount ya hace
  // polling en AuthProvider): si el contador sube, la campana hace un
  // pequeño gesto — nunca abre el panel solo, eso lo decide el usuario.
  useEffect(() => {
    const visibleUnreadCount = isOwnerMode ? 0 : unreadCount;
    if (
      visibleUnreadCount > previousUnreadRef.current &&
      !prefersReducedMotion
    ) {
      bellControls.start(BELL_SHAKE, {
        duration: BELL_SHAKE_DURATION,
        ease: MOTION_EASE.out,
      });
      pingControls.start(BADGE_PING, { duration: 0.6, ease: MOTION_EASE.out });
    }

    previousUnreadRef.current = visibleUnreadCount;
  }, [
    unreadCount,
    isOwnerMode,
    prefersReducedMotion,
    bellControls,
    pingControls,
  ]);

  function handleTap() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) setError("");

    if (!prefersReducedMotion) {
      bellControls.start(BELL_SHAKE, {
        duration: BELL_SHAKE_DURATION,
        ease: MOTION_EASE.out,
      });
    }
  }

  function closePanel({ restoreFocus = true } = {}) {
    setOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  async function handleOpenNotification(notification: AppNotification) {
    closePanel({ restoreFocus: false });

    if (!notification.is_read) {
      void markNotificationAsRead(notification.id).catch(() => {});
    }

    if (notification.link) {
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead();
    } catch {
      setError("No pudimos marcar las notificaciones como leídas.");
    }
  }

  const visibleNotifications = isOwnerMode ? [] : notifications;
  const previewNotifications = visibleNotifications.slice(0, 6);
  const visibleUnreadCount = isOwnerMode ? 0 : unreadCount;
  const hasUnread = visibleNotifications.some((item) => !item.is_read);

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
      closePanel();
    }
  }

  const listContent = notificationsLoading ? (
    // Un esqueleto con la forma real de la lista en vez de "Cargando...":
    // el panel no cambia de alto al llegar los datos, así que no da el
    // salto que daba antes justo debajo del cursor.
    <div aria-label="Cargando notificaciones" role="status">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 border-b border-black/[0.055] px-4 py-3.5"
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-soft" />
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="h-2.5 w-2/5 animate-pulse rounded-full bg-surface-soft" />
            <div className="h-2 w-4/5 animate-pulse rounded-full bg-surface-soft" />
          </div>
        </div>
      ))}
    </div>
  ) : error ? (
    <p className="p-6 text-center text-sm font-semibold text-red-600">
      {error}
    </p>
  ) : visibleNotifications.length === 0 ? (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: MOTION_DURATION.normal }}
      className="p-6 text-center text-sm text-muted"
    >
      {isOwnerMode
        ? "No tienes avisos nuevos sobre tus pisos."
        : "Todavía no tienes notificaciones."}
    </motion.p>
  ) : (
    <motion.ul variants={listContainer} initial="hidden" animate="show">
      {previewNotifications.map((notification) => (
        <motion.li key={notification.id} variants={listItem}>
          <motion.button
            type="button"
            onClick={() => handleOpenNotification(notification)}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: MOTION_DURATION.fast }}
            className={`relative flex w-full items-start gap-3 border-b border-black/5.5 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-surface-soft ${
              notification.is_read ? "bg-transparent" : "bg-primary/6"
            }`}
          >
            {/* Barra lateral en las no leídas: se puede escanear la
                columna sin leer un solo título. */}
            <motion.span
              aria-hidden
              initial={false}
              animate={{ opacity: notification.is_read ? 0 : 1 }}
              transition={{ duration: MOTION_DURATION.slow }}
              className="absolute inset-y-0 left-0 w-0.5 bg-primary"
            />
            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${notification.is_read ? "bg-surface-soft text-primary-dark" : "bg-primary text-white"}`}>
              <NotificationTypeIcon type={notification.type} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span className={`text-sm leading-5 text-brand-dark ${notification.is_read ? "font-semibold" : "font-bold"}`}>{notification.title}</span>
                <span className="shrink-0 text-3xs font-medium text-muted">{formatNotificationDate(notification.created_at)}</span>
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-secondary">{notification.message}</span>
            </span>
            <AnimatePresence>{!notification.is_read && <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />}</AnimatePresence>
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
          onClick={() => closePanel()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.normal }}
          className="fixed inset-0 z-(--z-modal) bg-black/20"
        />
      )}

      <motion.div
        ref={panelRef}
        id="notification-panel"
        role="dialog"
        aria-modal={!isDesktop}
        aria-labelledby="notification-panel-title"
        tabIndex={-1}
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
        className="fixed inset-x-0 bottom-0 z-(--z-modal) max-h-[75dvh] overflow-hidden rounded-t-panel border border-black/[0.06] bg-surface-raised shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-[calc(var(--safe-top)+4.5rem)] sm:w-96 sm:rounded-card sm:shadow-modal"
      >
        {!isDesktop && (
          <div className="flex shrink-0 justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-border" />
          </div>
        )}

        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {/* La campana solo "vuela" del botón al panel en escritorio,
                donde el panel nace justo debajo y el recorrido es de unos
                pocos píxeles. En móvil el panel es una hoja inferior: el
                icono cruzaría la pantalla entera y se leería como un
                elemento perdido, no como continuidad. */}
            <motion.div
              layoutId={open && isDesktop ? "notification-bell-icon" : undefined}
              transition={{ layout: MOTION_SPRING.gentle }}
            >
              <CoFlowBellIcon className="h-5 w-5 text-neutral-strong" />
            </motion.div>

            <div>
              <p id="notification-panel-title" className="text-sm font-bold text-neutral-strong">Notificaciones</p>
              {/* El recuento entra y sale con su propio alto: al marcar
                  todas como leídas desaparece sin dar un tirón al título. */}
              <AnimatePresence initial={false}>
                {visibleUnreadCount > 0 && (
                  <motion.p
                    key="unread-count"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: MOTION_DURATION.fast }}
                    className="overflow-hidden text-3xs font-semibold text-primary"
                  >
                    {visibleUnreadCount} sin leer
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {hasUnread && (
              <motion.button
                key="mark-all"
                type="button"
                onClick={handleMarkAllRead}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.94 }}
                transition={MOTION_SPRING.snappy}
                aria-label="Marcar todas como leídas"
                title="Marcar todas como leídas"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-soft hover:text-primary"
              >
                <MarkAllReadIcon />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <div className="max-h-[calc(75dvh-3.5rem)] overflow-y-auto sm:max-h-96">
          {listContent}
        </div>

        {visibleNotifications.length > 0 && (
          <motion.button
            type="button"
            onClick={() => { closePanel({ restoreFocus: false }); router.push("/notificaciones"); }}
            whileHover="hover"
            whileTap={{ scale: 0.99 }}
            transition={MOTION_SPRING.snappy}
            className="flex min-h-12 w-full items-center justify-center gap-1.5 border-t border-border bg-surface/70 px-4 text-xs font-bold text-primary-dark transition-colors hover:bg-surface-soft"
          >
            Ver todas las notificaciones
            {/* La flecha avanza al pasar por encima: indica que esto
                lleva a otra pantalla, no que despliegue más lista. */}
            <motion.span
              variants={{ hover: { x: 3 } }}
              transition={MOTION_SPRING.snappy}
              className="flex"
            >
              <ChevronRightIcon />
            </motion.span>
          </motion.button>
        )}
      </motion.div>
    </>
  );

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={handleTap}
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-controls="notification-panel"
        aria-haspopup="dialog"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
        className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-180 hover:bg-surface-soft"
      >
        <motion.div
          layoutId={!open && isDesktop ? "notification-bell-icon" : undefined}
          animate={bellControls}
          transition={{ layout: MOTION_SPRING.gentle }}
          // Pivote arriba: la campana cuelga, no gira sobre su centro.
          className="origin-top"
        >
          <CoFlowBellIcon className="h-6 w-6 text-neutral-strong" />
        </motion.div>

        <AnimatePresence>
          {visibleUnreadCount > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={MOTION_SPRING.snappy}
              className="absolute right-1 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-3xs font-bold text-white ring-2 ring-white"
            >
              {/* Onda que sale del contador cuando el número sube. Vive
                  detrás del propio badge para que no tape la cifra. */}
              <motion.span
                aria-hidden
                initial={{ opacity: 0, scale: 1 }}
                animate={pingControls}
                className="absolute inset-0 -z-10 rounded-full bg-primary"
              />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={visibleUnreadCount}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: [1.2, 1] }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: MOTION_DURATION.fast }}
                >
                  {visibleUnreadCount > 9 ? "9+" : visibleUnreadCount}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {mounted &&
        createPortal(
          <AnimatePresence>{open && panel}</AnimatePresence>,
          document.body
        )}
    </div>
  );
}

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} h`;

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function NotificationTypeIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "PRIVATE_MESSAGE_RECEIVED") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4Z" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (type.includes("APPLICATION") || type.includes("INVITATION")) return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** Doble check: "todo visto", el mismo gesto que usa la mensajería. */
function MarkAllReadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true"><path d="m2 13 4 4 8-9" /><path d="m12 15 2 2 8-9" /></svg>;
}

function ChevronRightIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;
}

function CoFlowBellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7.2 10.1c0-3 1.8-5.2 4.8-5.2s4.8 2.2 4.8 5.2c0 3.5 1.2 5.1 2 6H5.2c.8-.9 2-2.5 2-6Z" />
      <path d="M10 19h4" />
      <path d="M12 3.1v1.8" />
      <path d="M18.2 5.3 17 6.5M5.8 5.3 7 6.5" opacity=".65" />
    </svg>
  );
}
