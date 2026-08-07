"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { UserPhoto } from "@/types/userPhoto";

const MAX_PHOTOS = 9;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePhotoGallery({
  photos,
  onUpload,
  onDelete,
  onReorder,
}: {
  photos: UserPhoto[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (photoId: number) => Promise<void>;
  onReorder: (photoIds: number[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const sorted = [...photos].sort((a, b) => a.position - b.position);
  const remaining = Math.max(MAX_PHOTOS - photos.length, 0);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(
        `Solo puedes tener hasta ${MAX_PHOTOS} fotos. Elimina alguna antes de añadir más.`
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const invalid = files.find((file) => !ACCEPTED_TYPES.includes(file.type));

    if (invalid) {
      setError("Solo se aceptan imágenes en formato JPEG, PNG o WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError("");
    setUploading(true);

    try {
      await onUpload(files);
    } catch {
      setError("No pudimos subir las fotos. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(photoId: number) {
    if (busyPhotoId) return;
    setBusyPhotoId(photoId);

    try {
      await onDelete(photoId);
    } catch {
      setError("No pudimos eliminar la foto.");
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    if (busyPhotoId) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setBusyPhotoId(moved.id);

    try {
      await onReorder(reordered.map((photo) => photo.id));
    } catch {
      setError("No pudimos reordenar las fotos.");
    } finally {
      setBusyPhotoId(null);
    }
  }

  return (
    <div className="rounded-18 border border-border bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">Fotos</p>

        <span className="text-xs font-semibold text-muted">
          {photos.length}/{MAX_PHOTOS}
        </span>
      </div>

      <p className="mt-1 text-xs text-secondary">
        Muestra más de ti a las personas que vean tu perfil.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        onChange={(event) => handleFilesSelected(event.target.files)}
        disabled={uploading || remaining === 0}
        className="mt-4 block w-full text-sm text-muted file:mr-4 file:h-10 file:rounded-14 file:border-0 file:bg-primary file:px-4 file:text-sm file:font-bold file:text-white disabled:opacity-60"
      />

      {uploading && (
        <p className="mt-2 text-xs font-semibold text-muted">
          Subiendo fotos...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sorted.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative h-28 w-full overflow-hidden rounded-18 border border-border bg-surface-soft sm:h-32"
            >
              <Image
                src={photo.image_url}
                alt=""
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/50 p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={busyPhotoId !== null || index === 0}
                    onClick={() => handleMove(index, -1)}
                    aria-label="Mover antes"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-foreground disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={
                      busyPhotoId !== null || index === sorted.length - 1
                    }
                    onClick={() => handleMove(index, 1)}
                    aria-label="Mover después"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-foreground disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>

                <button
                  type="button"
                  disabled={busyPhotoId !== null}
                  onClick={() => handleDelete(photo.id)}
                  aria-label="Eliminar"
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-red-600 disabled:opacity-40"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
