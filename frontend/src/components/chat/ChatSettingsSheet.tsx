"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import BottomSheet from "@/components/ui/BottomSheet";
import { isChatMuted, setChatMuted } from "@/lib/chatMute";

export default function ChatSettingsSheet({
  open,
  onClose,
  threadKey,
  avatar,
  title,
  subtitle,
  viewLabel,
  onView,
  onOpenSafety,
}: {
  open: boolean;
  onClose: () => void;
  /** Clave estable del hilo (p. ej. `connection:12` o `community`) —
   * ahí se guarda la preferencia de silenciar. */
  threadKey: string;
  avatar: ReactNode;
  title: string;
  subtitle?: string;
  /** "Ver perfil" en chats privados, "Ver comunidad" en los de grupo. */
  viewLabel: string;
  onView: () => void;
  /** Solo en chats privados — abre el bloqueo/reporte ya existente. */
  onOpenSafety?: () => void;
}) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (open) setMuted(isChatMuted(threadKey));
  }, [open, threadKey]);

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    setChatMuted(threadKey, next);
  }

  return (
    <AnimatePresence>
      {open && (
        <BottomSheet onClose={onClose} ariaLabel="Ajustes del chat" className="sm:max-w-xs">
          <div className="px-5 pb-[calc(var(--safe-bottom)+1.25rem)] pt-2 sm:px-6 sm:pb-6">
            <div className="flex flex-col items-center pb-5 pt-2 text-center">
              {avatar}
              <p className="mt-3 text-base font-extrabold text-foreground">{title}</p>
              {subtitle && <p className="mt-0.5 text-xs font-semibold text-muted">{subtitle}</p>}
            </div>

            <div className="overflow-hidden rounded-18 border border-border">
              <SheetRow
                icon={<ProfileIcon />}
                label={viewLabel}
                onClick={() => {
                  onClose();
                  onView();
                }}
              />

              <SheetRow
                icon={<MuteIcon muted={muted} />}
                label={muted ? "Reactivar notificaciones" : "Silenciar notificaciones"}
                description="Solo en este dispositivo."
                onClick={toggleMuted}
              />

              {onOpenSafety && (
                <SheetRow
                  icon={<ShieldIcon />}
                  label="Bloquear o reportar"
                  destructive
                  onClick={() => {
                    onClose();
                    onOpenSafety();
                  }}
                />
              )}
            </div>
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  );
}

function SheetRow({
  icon,
  label,
  description,
  destructive = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  description?: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-surface-soft"
    >
      <span className={destructive ? "text-red-600" : "text-muted"}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-bold ${destructive ? "text-red-600" : "text-foreground"}`}>
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-secondary">{description}</span>
        )}
      </span>
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function MuteIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 6.5V6a3 3 0 0 0-5.9-.7" />
      <path d="M19 10v2a7 7 0 0 1-1.1 3.8M12 19v3M8 22h8" />
      {muted ? (
        <path d="M3 3l18 18" />
      ) : (
        <path d="M5 10v2a7 7 0 0 0 7 7 7 7 0 0 0 7-7v-2" />
      )}
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6Z" />
      <path d="M9.5 12l2 2 3.5-4" />
    </svg>
  );
}
