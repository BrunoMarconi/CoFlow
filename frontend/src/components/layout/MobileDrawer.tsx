"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import NavigationItem from "@/components/layout/NavigationItem";
import { getConnectionRequests } from "@/services/connections";
import {
  BookmarkIcon,
  CloseIcon,
  CompassIcon,
  HomeIcon,
  KeyIcon,
  LogoutIcon,
  MessageIcon,
  ProfileIcon,
  SettingsIcon,
  UsersIcon,
  PlusIcon,
} from "@/components/layout/NavIcons";

const TRANSITION_MS = 220;

export default function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout, community, ownerProfile } = useAuth();

  const conexionesTab = searchParams.get("tab");
  const isMessagesActive =
    pathname.startsWith("/mensajes") ||
    (pathname === "/conexiones" &&
      (conexionesTab === null || conexionesTab === "conectados"));
  const isConexionesActive =
    pathname === "/conexiones" &&
    (conexionesTab === "recibidas" || conexionesTab === "enviadas");

  const [pendingConnections, setPendingConnections] = useState<
    number | undefined
  >(undefined);

  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timeout = setTimeout(() => setMounted(false), TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    let active = true;

    getConnectionRequests()
      .then((requests) => {
        if (active) setPendingConnections(requests.received.length);
      })
      .catch(() => {
        // Sin contador si falla; no mostramos un número inventado.
      });

    return () => {
      active = false;
    };
  }, [open]);

  if (!mounted || !user) return null;

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  function isActive(href: string) {
    if (href === "/mi-comunidad") return pathname.startsWith("/mi-comunidad");

    if (href === "/usuarios") {
      return (
        pathname.startsWith("/usuarios") ||
        (pathname.startsWith("/personas") &&
          !pathname.startsWith("/personas/guardadas"))
      );
    }

    if (href === "/comunidades") {
      return (
        pathname.startsWith("/comunidades") &&
        !pathname.startsWith("/mi-comunidad")
      );
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className={`absolute inset-0 bg-[#0B1F17]/65 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`absolute inset-y-0 left-0 flex h-screen w-[90vw] max-w-[360px] flex-col bg-surface shadow-2xl transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <span className="text-lg font-bold tracking-tight text-foreground">
            CoFlow
          </span>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-surface-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Profile Card */}
        <Link
          href="/perfil"
          onClick={onClose}
          className="mx-4 mt-4 mb-3 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-3 transition hover:bg-brand/10 hover:border-brand/40"
        >
          <Avatar name={fullName} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {fullName || "Mi cuenta"}
            </p>
            <p className="text-xs font-semibold text-brand">
              Ver mi perfil
            </p>
          </div>
        </Link>

        {/* Navigation Scroll */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* Principal */}
          <div className="mb-6">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 mb-2.5">
              Principal
            </p>
            <div className="space-y-1">
              {community && (
                <NavigationItem
                  href="/mi-comunidad"
                  label="Tu comunidad"
                  icon={HomeIcon}
                  active={isActive("/mi-comunidad")}
                  onClick={onClose}
                />
              )}
              <NavigationItem
                href="/comunidades"
                label={community ? "Explorar" : "Explorar comunidades"}
                icon={CompassIcon}
                active={isActive("/comunidades")}
                onClick={onClose}
              />
              <NavigationItem
                href="/usuarios"
                label="Personas"
                icon={UsersIcon}
                active={isActive("/usuarios")}
                onClick={onClose}
              />
            </div>
          </div>

          {/* Comunicación */}
          <div className="mb-6">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 mb-2.5">
              Comunicación
            </p>
            <div className="space-y-1">
              <NavigationItem
                href="/conexiones?tab=conectados"
                label="Mensajes"
                icon={MessageIcon}
                active={isMessagesActive}
                onClick={onClose}
              />
              <NavigationItem
                href="/conexiones"
                label="Conexiones"
                icon={UsersIcon}
                active={isConexionesActive}
                count={pendingConnections}
                onClick={onClose}
              />
              <NavigationItem
                href="/personas/guardadas"
                label="Guardados"
                icon={BookmarkIcon}
                active={pathname.startsWith("/personas/guardadas")}
                onClick={onClose}
              />
            </div>
          </div>

          {/* Crear */}
          {!community && (
            <div className="mb-6">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 mb-2.5">
                Crear
              </p>
              <div className="space-y-1">
                <NavigationItem
                  href="/crear/comunidad"
                  label="Crear comunidad"
                  icon={PlusIcon}
                  active={pathname.startsWith("/crear/comunidad")}
                  onClick={onClose}
                />
              </div>
            </div>
          )}

          {/* Cuenta */}
          <div>
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 mb-2.5">
              Cuenta
            </p>
            <div className="space-y-1">
              <NavigationItem
                href="/perfil"
                label="Mi perfil"
                icon={ProfileIcon}
                active={pathname.startsWith("/perfil")}
                onClick={onClose}
              />
              <NavigationItem
                href={ownerProfile ? "/propietarios" : "/propietarios/perfil"}
                label="Publicar un piso"
                icon={KeyIcon}
                active={pathname.startsWith("/propietarios")}
                onClick={onClose}
              />
              <NavigationItem
                href="/ajustes"
                label="Ajustes"
                icon={SettingsIcon}
                active={pathname.startsWith("/ajustes")}
                onClick={onClose}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line px-3 py-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-600/90 transition hover:bg-red-50/70 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            <LogoutIcon className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
