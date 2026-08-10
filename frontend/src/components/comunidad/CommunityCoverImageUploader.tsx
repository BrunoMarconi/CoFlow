"use client";

import { useRef, useState } from "react";
import CommunityCover from "@/components/ui/CommunityCover";
import { deleteCommunityCover, uploadCommunityCover } from "@/services/communities";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import type { Community } from "@/types/community";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function CommunityCoverImageUploader({
  community,
  onUpdated,
}: {
  community: Community;
  onUpdated: (community: Community) => void;
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
      const updated = await uploadCommunityCover(community.id, file);
      onUpdated(updated);
    } catch (uploadError) {
      setError(
        getCommunityErrorMessage(
          uploadError,
          "No pudimos subir la portada. Inténtalo de nuevo."
        )
      );
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
      const updated = await deleteCommunityCover(community.id);
      onUpdated(updated);
    } catch {
      setError("No pudimos quitar la portada personalizada.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-24 border border-border bg-surface p-5 shadow-soft sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
        Portada personalizada
      </p>

      <p className="mt-2 text-sm leading-6 text-muted">
        Si ya tenéis piso o queréis una portada propia, subid una imagen para
        sustituir el fondo de color con avatares. Si no subís nada, se
        seguirá mostrando siempre el color elegido con las fotos de los
        miembros.
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <CommunityCover
          name={community.name}
          coverColor={community.cover_color}
          coverImageUrl={community.cover_image_url}
          members={community.members.slice(0, 4).map((member) => ({
            id: member.id.toString(),
            firstName: member.user.first_name,
            lastName: member.user.last_name,
            imageUrl: member.user.avatar_url,
          }))}
          memberCount={community.member_count}
          className="h-28 w-full shrink-0 rounded-18 sm:w-44"
        />

        <div className="flex flex-col gap-2 sm:flex-1">
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
            className="inline-flex w-fit items-center rounded-18 bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
          >
            {community.cover_image_url
              ? "Cambiar imagen"
              : "Subir imagen personalizada"}
          </button>

          {community.cover_image_url && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex w-fit items-center rounded-18 border border-border px-5 py-2.5 text-sm font-bold text-secondary transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
            >
              Quitar imagen y volver al color
            </button>
          )}

          {error && (
            <p role="alert" className="text-xs font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
