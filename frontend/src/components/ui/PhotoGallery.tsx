"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = {
  id: string | number;
  src: string;
  alt: string;
};

export default function PhotoGallery({
  images,
  layout = "carousel",
  priority = false,
  className,
  empty,
}: {
  images: GalleryImage[];
  layout?: "carousel" | "grid";
  priority?: boolean;
  className?: string;
  empty?: React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, images.length - 1));
    const track = trackRef.current;
    if (track) {
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }
    setActiveIndex(next);
  }

  if (images.length === 0) return <>{empty ?? null}</>;

  return (
    <>
      {layout === "carousel" ? (
        <div className={cn("relative h-full w-full", className)}>
          <div
            ref={trackRef}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(event) => {
              const width = event.currentTarget.clientWidth;
              if (width > 0) setActiveIndex(Math.round(event.currentTarget.scrollLeft / width));
            }}
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setViewerIndex(index)}
                className="relative h-full w-full shrink-0 snap-center overflow-hidden text-left"
                aria-label={`Abrir foto ${index + 1} de ${images.length}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  unoptimized
                  priority={priority && index === 0}
                  sizes="(max-width: 768px) 100vw, 1024px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {images.length > 1 ? (
            <>
              <GalleryArrow direction="previous" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)} />
              <GalleryArrow direction="next" disabled={activeIndex === images.length - 1} onClick={() => goTo(activeIndex + 1)} />
              <span className="pointer-events-none absolute bottom-6 right-5 inline-flex h-9 items-center gap-2 rounded-full bg-black/75 px-3 text-xs font-semibold text-white backdrop-blur">
                <Images className="h-4 w-4" />
                {activeIndex + 1} / {images.length}
              </span>
              <div className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
                {images.slice(0, 7).map((image, index) => (
                  <span key={image.id} className={cn("h-1.5 rounded-full bg-white shadow", index === activeIndex ? "w-4" : "w-1.5 opacity-70")} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className={cn("grid grid-cols-3 gap-2", className)}>
          {images.slice(0, 6).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setViewerIndex(index)}
              className={cn(
                "relative overflow-hidden rounded-[0.9rem] bg-[#f1f1f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
                index === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
              )}
              aria-label={`Ver foto ${index + 1} de ${images.length}`}
            >
              <Image src={image.src} alt={image.alt} fill unoptimized sizes="(max-width: 1024px) 33vw, 240px" className="object-cover transition duration-300 hover:scale-[1.02]" />
              {index === 5 && images.length > 6 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-semibold text-white">+{images.length - 5}</span>
              ) : null}
            </button>
          ))}
        </div>
      )}

      <PhotoViewer images={images} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
    </>
  );
}

function GalleryArrow({ direction, disabled, onClick }: { direction: "previous" | "next"; disabled: boolean; onClick: () => void }) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      aria-label={direction === "previous" ? "Foto anterior" : "Foto siguiente"}
      className={cn(
        "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-[0_3px_16px_rgba(0,0,0,0.18)] transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 sm:flex",
        direction === "previous" ? "left-5" : "right-5"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function PhotoViewer({ images, initialIndex, onClose }: { images: GalleryImage[]; initialIndex: number | null; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const open = initialIndex !== null;

  const move = useCallback((nextIndex: number) => {
    const next = Math.max(0, Math.min(nextIndex, images.length - 1));
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
    setIndex(next);
  }, [images.length, reducedMotion]);

  useEffect(() => {
    if (initialIndex === null) return;
    const frame = requestAnimationFrame(() => {
      setIndex(initialIndex);
      const track = trackRef.current;
      if (track) track.scrollLeft = initialIndex * track.clientWidth;
    });
    return () => cancelAnimationFrame(frame);
  }, [initialIndex]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") move(index - 1);
      if (event.key === "ArrowRight") move(index + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [index, move, onClose, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col bg-[#111111]"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Galería de fotos"
        >
          <header className="flex h-[calc(4.5rem+var(--safe-top))] shrink-0 items-end justify-between px-4 pb-3 pt-[var(--safe-top)] text-white sm:px-7">
            <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 transition hover:bg-white/20" aria-label="Cerrar galería"><X className="h-6 w-6" /></button>
            <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold tabular-nums">{index + 1} / {images.length}</span>
          </header>

          <div className="relative min-h-0 flex-1">
            <div
              ref={trackRef}
              className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onScroll={(event) => {
                const width = event.currentTarget.clientWidth;
                if (width > 0) setIndex(Math.round(event.currentTarget.scrollLeft / width));
              }}
            >
              {images.map((image) => (
                <div key={image.id} className="relative h-full w-full shrink-0 snap-center">
                  <Image src={image.src} alt={image.alt} fill unoptimized sizes="100vw" className="object-contain" />
                </div>
              ))}
            </div>
            {images.length > 1 ? (
              <>
                <GalleryArrow direction="previous" disabled={index === 0} onClick={() => move(index - 1)} />
                <GalleryArrow direction="next" disabled={index === images.length - 1} onClick={() => move(index + 1)} />
              </>
            ) : null}
          </div>
          <div className="h-[max(1rem,var(--safe-bottom))] shrink-0" />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
