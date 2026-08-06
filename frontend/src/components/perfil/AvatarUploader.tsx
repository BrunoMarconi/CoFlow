"use client";

import { useRef, useState } from "react";
import { deleteAvatar, uploadAvatar } from "@/services/users";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
    } catch {
      setError("No pudimos subir tu foto. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await deleteAvatar();
      await onUpdated();
    } catch {
      setError("No pudimos quitar tu foto.");
    } finally {
      setBusy(false);
    }
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
        onClick={() => inputRef.current?.click()}
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
          onClick={handleRemove}
          disabled={busy}
          aria-label="Quitar foto de perfil"
          title="Quitar foto"
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-surface text-muted shadow-soft transition hover:text-red-600 disabled:opacity-60"
        >
          <CloseIcon />
        </button>
      )}

      {error && (
        <p
          role="alert"
          className="absolute left-1/2 top-full mt-2 w-max max-w-[220px] -translate-x-1/2 text-center text-xs font-semibold text-red-600"
        >
          {error}
        </p>
      )}
    </>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}
