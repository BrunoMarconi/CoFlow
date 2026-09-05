"use client";

import { useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export default function ImageLightbox({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-black/90 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-[calc(1rem+var(--safe-top))] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <CloseIcon />
      </button>
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative h-full max-h-[calc(100dvh-2rem)] w-full max-w-6xl"
      >
        <Image src={url} alt="Foto ampliada" fill unoptimized sizes="100vw" className="rounded-14 object-contain" />
      </div>
    </motion.div>,
    document.body
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
