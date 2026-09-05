"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import BottomSheet from "@/components/ui/BottomSheet";
import ImageLightbox from "@/components/chat/ImageLightbox";
import { isChatMuted, setChatMuted } from "@/lib/chatMute";
import { collectChatImages, type ChatImageItem } from "@/lib/collectChatImages";

type Step = "menu" | "gallery";

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
  fetchMessages,
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
  /** Si se pasa, aparece "Fotos compartidas" — misma función que ya usa
   * el chat para paginar mensajes, reutilizada para sacar solo las que
   * llevan imagen. */
  fetchMessages?: (params: {
    limit: number;
    skip?: number;
  }) => Promise<{ image_url?: string | null; created_at: string }[]>;
}) {
  const [muted, setMuted] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [images, setImages] = useState<ChatImageItem[] | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      if (open) setMuted(isChatMuted(threadKey));
      else {
        setStep("menu");
        setImages(null);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [open, threadKey]);

  function toggleMuted() {
    const next = !muted;
    setMuted(next);
    setChatMuted(threadKey, next);
  }

  async function openGallery() {
    setStep("gallery");
    if (images !== null || !fetchMessages) return;
    setLoadingImages(true);
    try {
      const collected = await collectChatImages(fetchMessages);
      setImages(collected);
    } catch {
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <BottomSheet onClose={onClose} ariaLabel="Ajustes del chat" className="sm:max-w-xs">
            <div className="px-5 pb-[calc(var(--safe-bottom)+1.25rem)] pt-2 sm:px-6 sm:pb-6">
              {step === "menu" ? (
                <>
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

                    {fetchMessages && (
                      <SheetRow
                        icon={<ImageIcon />}
                        label="Fotos compartidas"
                        onClick={() => void openGallery()}
                      />
                    )}

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
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 pb-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep("menu")}
                      aria-label="Volver"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-surface-soft"
                    >
                      <BackIcon />
                    </button>
                    <p className="text-sm font-extrabold text-foreground">Fotos compartidas</p>
                  </div>

                  {loadingImages ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <div key={index} className="aspect-square animate-pulse rounded-10 bg-surface-soft" />
                      ))}
                    </div>
                  ) : !images || images.length === 0 ? (
                    <p className="py-8 text-center text-sm text-secondary">
                      Todavía no se han compartido fotos en este chat.
                    </p>
                  ) : (
                    <div className="grid max-h-[50vh] grid-cols-3 gap-1.5 overflow-y-auto">
                      {images.map((image, index) => (
                        <button
                          key={`${image.url}-${index}`}
                          type="button"
                          onClick={() => setLightboxUrl(image.url)}
                          className="relative aspect-square overflow-hidden rounded-10 bg-surface-soft"
                        >
                          <Image src={image.url} alt="Foto compartida" fill unoptimized sizes="33vw" className="object-cover transition-transform duration-200 hover:scale-[1.03]" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxUrl && (
          <ImageLightbox key={lightboxUrl} url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
        )}
      </AnimatePresence>
    </>
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

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" />
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}
