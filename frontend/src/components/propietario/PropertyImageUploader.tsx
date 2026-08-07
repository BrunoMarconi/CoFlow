"use client";

import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
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
  onUpload: (
    files: File[],
    onProgress?: (percent: number) => void
  ) => Promise<void>;
  onDelete: (imageId: number) => Promise<void>;
  onSetCover: (imageId: number) => Promise<void>;
  onReorder: (imageIds: number[]) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [busyImageId, setBusyImageId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const sorted = [...images].sort((a, b) => a.position - b.position);
  const remaining = Math.max(MAX_IMAGES - images.length, 0);

  async function processFiles(fileList: FileList | File[] | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

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
      setError("Solo se aceptan imágenes en formato JPEG, PNG o WebP.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setError("");
    setUploading(true);
    setUploadProgress(0);

    try {
      await onUpload(files, setUploadProgress);
    } catch {
      setError("No pudimos subir las fotografías. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (remaining === 0 || uploading) return;
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (remaining === 0 || uploading) return;
    processFiles(event.dataTransfer.files);
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

  async function commitReorder(fromId: number, toId: number) {
    if (fromId === toId || busyImageId) return;

    const fromIndex = sorted.findIndex((image) => image.id === fromId);
    const toIndex = sorted.findIndex((image) => image.id === toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...sorted];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    setBusyImageId(moved.id);

    try {
      await onReorder(reordered.map((image) => image.id));
    } catch {
      setError("No pudimos reordenar las fotografías.");
    } finally {
      setBusyImageId(null);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    await commitReorder(sorted[index].id, sorted[targetIndex].id);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Fotografías</p>

        <span className="text-xs font-semibold text-muted">
          {images.length}/{MAX_IMAGES}
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => remaining > 0 && !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={remaining === 0 || uploading ? -1 : 0}
        aria-disabled={remaining === 0 || uploading}
        className={`mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-150 ${
          remaining === 0 || uploading
            ? "cursor-not-allowed border-line bg-surface-soft opacity-60"
            : dragOver
              ? "cursor-pointer border-brand bg-brand/10"
              : "cursor-pointer border-line bg-surface-soft hover:border-brand/40"
        }`}
      >
        <UploadCloudIcon />

        <p className="text-sm font-semibold text-foreground">
          Arrastra tus fotos aquí o haz clic para elegirlas
        </p>
        <p className="text-xs text-muted">
          JPEG, PNG o WebP · hasta {MAX_IMAGES} fotografías
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          onChange={(event) => processFiles(event.target.files)}
          disabled={uploading || remaining === 0}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full rounded-full bg-brand transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-muted">
            Subiendo fotografías... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sorted.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => setDraggedId(image.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTargetId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedId !== null && draggedId !== image.id) {
                  setDropTargetId(image.id);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedId !== null) commitReorder(draggedId, image.id);
                setDraggedId(null);
                setDropTargetId(null);
              }}
              className={`group relative h-28 w-full cursor-grab overflow-hidden rounded-2xl border bg-surface-soft transition active:cursor-grabbing sm:h-32 ${
                dropTargetId === image.id
                  ? "border-brand ring-2 ring-brand/30"
                  : "border-line"
              } ${draggedId === image.id ? "opacity-50" : ""}`}
            >
              <Image
                src={image.image_url}
                alt=""
                fill
                unoptimized
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover"
                draggable={false}
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

      {sorted.length > 1 && (
        <p className="mt-2 text-xs text-muted">
          Arrastra una fotografía sobre otra para reordenarlas.
        </p>
      )}
    </div>
  );
}

function UploadCloudIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7 text-brand"
      aria-hidden="true"
    >
      <path d="M7 18a4.5 4.5 0 0 1-1-8.9A5.5 5.5 0 0 1 16.5 8a4 4 0 0 1 .5 7.9" />
      <path d="M12 12v7" />
      <path d="m9 15 3-3 3 3" />
    </svg>
  );
}
