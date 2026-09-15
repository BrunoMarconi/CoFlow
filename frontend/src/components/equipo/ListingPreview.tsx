"use client";

import Image from "next/image";
import { Bath, BedDouble, Camera, Check, CircleCheck, CircleDashed, LoaderCircle, MapPin, Ruler, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatEuros, type ListingDraft, type ReadinessItem, type WizardStep } from "@/lib/teamListing";

/* Tarjeta en vivo + lista de lo que falta. El equipo ve cómo quedará el
 * anuncio mientras lo rellena y, sobre todo, qué falta para publicarlo:
 * cada punto pendiente lleva directamente al paso donde se completa. */
export default function ListingPreview({
  draft,
  coverUrl,
  imageCount,
  ownerName,
  statusLabel,
  readiness,
  onJump,
  publishLabel,
  publishing,
  disabled,
  onPublish,
}: {
  draft: ListingDraft;
  coverUrl: string | null;
  imageCount: number;
  ownerName: string | null;
  statusLabel: string;
  readiness: ReadinessItem[];
  onJump: (step: WizardStep) => void;
  publishLabel: string;
  publishing: boolean;
  disabled: boolean;
  onPublish: () => void;
}) {
  const done = readiness.filter((item) => item.done).length;
  const total = readiness.length;
  const ready = done === total;
  const rent = draft.rent.trim() ? Number(draft.rent.replace(/\./g, "")) : null;
  const location = [draft.addressLine.trim(), draft.neighborhood.trim()].filter(Boolean).join(" · ") || "Dirección pendiente";

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-panel bg-surface shadow-soft">
        <div className="relative aspect-[4/3] bg-surface-soft">
          {coverUrl ? (
            <Image src={coverUrl} alt="" fill unoptimized sizes="(min-width: 1280px) 336px, 100vw" className="object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-secondary">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary shadow-soft">
                <Camera className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold">La portada aparecerá aquí</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-2xs font-bold text-brand-dark shadow-soft backdrop-blur">
            {statusLabel}
          </span>
          {imageCount > 0 ? (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-2xs font-bold text-white backdrop-blur">
              {imageCount} {imageCount === 1 ? "foto" : "fotos"}
            </span>
          ) : null}
        </div>

        <div className="p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{location}</span>
          </p>
          <h3
            className={cn(
              "mt-1.5 line-clamp-2 font-rounded text-lg font-semibold leading-snug tracking-[-0.02em]",
              draft.title.trim() ? "text-brand-dark" : "text-muted"
            )}
          >
            {draft.title.trim() || "Título del anuncio"}
          </h3>
          <p className="mt-2">
            <strong className="font-rounded text-2xl font-semibold tracking-[-0.03em] text-brand-dark">
              {rent !== null && Number.isFinite(rent) ? formatEuros(rent) : "— €"}
            </strong>
            <span className="ml-1 text-xs font-semibold text-secondary">/ mes</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-semibold text-secondary [&_svg]:h-4 [&_svg]:w-4">
            <span className="flex items-center gap-1.5"><BedDouble />{draft.bedrooms}</span>
            <span className="flex items-center gap-1.5"><Bath />{draft.bathrooms}</span>
            <span className="flex items-center gap-1.5"><Users />{draft.maxTenants} {draft.maxTenants === 1 ? "plaza" : "plazas"}</span>
            {draft.surfaceM2.trim() ? <span className="flex items-center gap-1.5"><Ruler />{draft.surfaceM2} m²</span> : null}
          </div>
          {ownerName ? (
            <p className="mt-3 truncate border-t border-border pt-3 text-xs text-secondary">
              Cliente · <strong className="font-bold text-brand-dark">{ownerName}</strong>
            </p>
          ) : null}
        </div>
      </article>

      <section className="rounded-panel bg-surface p-4 shadow-soft" aria-label="Lo que falta para publicar">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-brand-dark">{ready ? "Lista para publicar" : "Para publicar"}</p>
          <span className="text-xs font-bold tabular-nums text-secondary">{done}/{total}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-soft">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} />
        </div>

        <ul className="mt-3 space-y-0.5">
          {readiness.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onJump(item.step)}
                className="press-row hover-row flex min-h-9 w-full items-center gap-2.5 rounded-10 px-2 text-left text-sm"
              >
                {item.done ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <CircleDashed className="h-5 w-5 shrink-0 text-muted" />
                )}
                <span className={item.done ? "text-secondary" : "font-semibold text-brand-dark"}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onPublish}
          disabled={disabled || !ready}
          className="press-control mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-dark px-5 text-sm font-bold text-white shadow-button transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publishing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CircleCheck className="h-4 w-4" />}
          {publishLabel}
        </button>
        <p className="mt-2 text-center text-2xs text-muted">
          {ready ? "Quedará en la cuenta del cliente como vivienda publicada." : `Faltan ${total - done} ${total - done === 1 ? "dato" : "datos"}.`}
        </p>
      </section>
    </div>
  );
}
