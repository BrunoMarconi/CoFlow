"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { deleteAvatar, uploadAvatar } from "@/services/users";
import { getCommunityErrorMessage } from "@/lib/communityErrors";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const AVATAR_PRESETS = [
  {
    id: "olivo",
    name: "Olivo",
    description: "Cálido y natural",
    src: "/images/avatar-presets/avatar-olivo.png",
  },
  {
    id: "terracota",
    name: "Terracota",
    description: "Creativa y alegre",
    src: "/images/avatar-presets/avatar-terracota.png",
  },
  {
    id: "marino",
    name: "Marino",
    description: "Sereno y moderno",
    src: "/images/avatar-presets/avatar-marino.png",
  },
  {
    id: "cielo",
    name: "Cielo",
    description: "Suave y luminoso",
    src: "/images/avatar-presets/avatar-cielo.png",
  },
] as const;

export default function AvatarUploader({
  hasAvatar,
  onUpdated,
}: {
  hasAvatar: boolean;
  onUpdated: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    if (!chooserOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) setChooserOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [chooserOpen, busy]);

  async function handleFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Solo se aceptan imágenes en formato JPEG, PNG o WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError("");
    setBusy(true);

    try {
      await uploadAvatar(file);
      await onUpdated();
      setChooserOpen(false);
    } catch (error) {
      setError(
        getCommunityErrorMessage(
          error,
          "No pudimos subir tu foto. Inténtalo de nuevo."
        )
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handlePresetSelected() {
    const preset = AVATAR_PRESETS.find((item) => item.id === selectedPreset);
    if (!preset || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(preset.src);
      if (!response.ok) throw new Error("No se pudo cargar el avatar");

      const blob = await response.blob();
      const file = new File([blob], `avatar-coflow-${preset.id}.png`, {
        type: "image/png",
      });

      await uploadAvatar(file);
      await onUpdated();
      setChooserOpen(false);
    } catch (error) {
      setError(
        getCommunityErrorMessage(
          error,
          "No pudimos guardar este avatar. Inténtalo de nuevo."
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await deleteAvatar();
      await onUpdated();
      setSelectedPreset(null);
    } catch {
      setError("No pudimos quitar tu foto.");
    } finally {
      setBusy(false);
    }
  }

  function openOwnPhotoPicker() {
    setChooserOpen(false);
    window.setTimeout(() => inputRef.current?.click(), 0);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={(event) => handleFileSelected(event.target.files)}
        disabled={busy}
        className="hidden"
      />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          setError("");
          setChooserOpen(true);
        }}
        disabled={busy}
        aria-label={hasAvatar ? "Cambiar foto de perfil" : "Añadir foto de perfil"}
        title={hasAvatar ? "Cambiar foto" : "Añadir foto"}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-primary text-white shadow-soft transition hover:bg-primary-hover disabled:opacity-60"
      >
        <CameraIcon />
      </button>

      {hasAvatar && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
            handleRemove();
          }}
          disabled={busy}
          aria-label="Quitar foto de perfil"
          title="Quitar foto"
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-surface text-muted shadow-soft transition hover:text-red-600 disabled:opacity-60"
        >
          <CloseIcon />
        </button>
      )}

      {error && !chooserOpen && (
        <p
          role="alert"
          className="absolute left-1/2 top-full z-10 mt-2 w-max max-w-[220px] -translate-x-1/2 text-center text-xs font-semibold text-red-600"
        >
          {error}
        </p>
      )}

      {chooserOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target && !busy) {
                setChooserOpen(false);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="avatar-chooser-title"
              className="max-h-[92dvh] w-full overflow-y-auto rounded-t-24 border border-border bg-surface p-5 shadow-2xl sm:max-w-xl sm:rounded-24 sm:p-6"
            >
              <header className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="avatar-chooser-title" className="text-xl font-extrabold text-foreground">
                    {hasAvatar ? "Cambia tu foto" : "Elige tu avatar"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-secondary">
                    Escoge un personaje de CoFlow o sube una foto tuya.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setChooserOpen(false)}
                  disabled={busy}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft"
                >
                  <CloseIcon />
                </button>
              </header>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                {AVATAR_PRESETS.map((preset) => {
                  const selected = selectedPreset === preset.id;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset.id)}
                      aria-pressed={selected}
                      className={`group overflow-hidden rounded-18 border bg-surface text-left shadow-soft transition-all duration-200 ${
                        selected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="relative block aspect-square overflow-hidden bg-surface-muted">
                        <Image
                          src={preset.src}
                          alt={`Avatar ${preset.name}`}
                          fill
                          sizes="(max-width: 640px) 46vw, 240px"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {selected && (
                          <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-button">
                            <CheckIcon />
                          </span>
                        )}
                      </span>

                      <span className="block p-3">
                        <span className="block text-sm font-extrabold text-foreground">
                          {preset.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-secondary">
                          {preset.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <p role="alert" className="mt-4 text-center text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={openOwnPhotoPicker}
                  disabled={busy}
                  className="flex h-12 items-center justify-center gap-2 rounded-14 border border-border bg-surface px-4 text-sm font-bold text-foreground shadow-soft transition hover:border-primary/40 disabled:opacity-60"
                >
                  <UploadIcon />
                  Subir mi foto
                </button>

                <button
                  type="button"
                  onClick={handlePresetSelected}
                  disabled={!selectedPreset || busy}
                  className="flex h-12 items-center justify-center rounded-14 bg-primary px-4 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busy ? "Guardando..." : "Usar este avatar"}
                </button>
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="m6 12 4 4 8-9" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary" aria-hidden="true">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}
