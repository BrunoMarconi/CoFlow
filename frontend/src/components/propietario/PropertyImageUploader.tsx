"use client";

import { useRef, useState } from "react";
import type { PropertyImage } from "@/types/property";

const MAX_IMAGES = 15;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PropertyImageUploader({
  images,
  onUpload,
  onDelete,
  onSetCover,
  onReorder,
}: {
  images: PropertyImage[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (imageId: number) => Promise<void>;
  onSetCover: (imageId: number) => Promise<void>;
  onReorder: (imageIds: number[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busyImageId, setBusyImageId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const sorted = [...images].sort((a, b) => a.position - b.position);
  const remaining = Math.max(MAX_IMAGES - images.length, 0);

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    if (images.length + files.length > MAX_IMAGES) {
      setError(
        `Solo puedes tener hasta ${MAX_IMAGES} fotografías. Elimina alguna antes de añadir más.`
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const invalid = files.find(
      (file) => !ACCEPTED_TYPES.includes(file.type)
    );

    if (invalid) {
      setError(
        "Solo se aceptan imágenes en formato JPEG, PNG o WebP."
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError("");
    setUploading(true);

    try {
      await onUpload(files);
    } catch {
      setError("No pudimos subir las fotografías. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: number) {
    if (busyImageId) return;
    setBusyImageId(imageId);

    try {
      await onDelete(imageId);
    } catch {
      setError("No pudimos eliminar la fotografía.");
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleSetCover(imageId: number) {
    if (busyImageId) return;
    setBusyImageId(imageId);

    try {
      await onSetCover(imageId);
    } catch {
      setError("No pudimos cambiar la portada.");
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    if (busyImageId) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setBusyImageId(moved.id);

    try {
      await onReorder(reordered.map((image) => image.id));
    } catch {
      setError("No pudimos reordenar las fotografías.");
    } finally {
      setBusyImageId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">
          Fotografías
        </p>

        <span className="text-xs font-semibold text-muted">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        onChange={(event) => handleFilesSelected(event.target.files)}
        disabled={uploading || remaining === 0}
        className="mt-3 block w-full text-sm text-muted file:mr-4 file:h-10 file:rounded-xl file:border-0 file:bg-brand file:px-4 file:text-sm file:font-bold file:text-white disabled:opacity-60"
      />

      {uploading && (
        <p className="mt-2 text-xs font-semibold text-muted">
          Subiendo fotografías...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 text-xs font-semibold text-red-600"
        >
          {error}
        </p>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sorted.map((image, index) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface-soft"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt=""
                className="h-28 w-full object-cover sm:h-32"
              />

              {image.is_cover && (
                <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-bold text-white">
                  Portada
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/50 p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={busyImageId !== null || index === 0}
                    onClick={() => handleMove(index, -1)}
                    aria-label="Mover antes"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-foreground disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={
                      busyImageId !== null || index === sorted.length - 1
                    }
                    onClick={() => handleMove(index, 1)}
                    aria-label="Mover después"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-foreground disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex gap-1">
                  {!image.is_cover && (
                    <button
                      type="button"
                      disabled={busyImageId !== null}
                      onClick={() => handleSetCover(image.id)}
                      className="h-7 rounded-lg bg-white/90 px-2 text-[10px] font-bold text-foreground disabled:opacity-40"
                    >
                      Portada
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busyImageId !== null}
                    onClick={() => handleDelete(image.id)}
                    aria-label="Eliminar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-xs font-bold text-red-600 disabled:opacity-40"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
