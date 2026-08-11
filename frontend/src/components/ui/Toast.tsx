"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/* No existía ningún sistema de toast en el proyecto (revisado
 * package.json: sin sonner/react-hot-toast/react-toastify). API
 * imperativa a propósito (sin hook ni Provider) — igual que esas
 * librerías: basta con montar <Toaster /> una vez (en AppShell) y
 * llamar a toast.success(...)/toast.error(...) desde cualquier sitio,
 * incluso fuera de un componente (p. ej. dentro de un catch). */

type ToastVariant = "default" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

const DEFAULT_DURATION_MS = 3200;

let items: ToastItem[] = [];
let nextId = 1;
let listeners: Array<(items: ToastItem[]) => void> = [];

function emit() {
  listeners.forEach((listener) => listener(items));
}

function push(message: string, variant: ToastVariant, durationMs: number) {
  const id = nextId++;
  items = [...items, { id, message, variant }];
  emit();

  if (durationMs > 0) {
    setTimeout(() => dismiss(id), durationMs);
  }

  return id;
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export const toast = {
  show: (message: string, durationMs = DEFAULT_DURATION_MS) =>
    push(message, "default", durationMs),
  success: (message: string, durationMs = DEFAULT_DURATION_MS) =>
    push(message, "success", durationMs),
  error: (message: string, durationMs = DEFAULT_DURATION_MS) =>
    push(message, "error", durationMs),
  dismiss,
};

/** Montar una única vez (AppShell). Sin props: lee del store módulo. */
export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    listeners.push(setToasts);

    return () => {
      listeners = listeners.filter((listener) => listener !== setToasts);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex flex-col items-center gap-2 px-4 pb-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] sm:items-end sm:px-6 sm:pb-6">
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : 12,
              scale: prefersReducedMotion ? 1 : 0.97,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: prefersReducedMotion ? 0 : 8,
              scale: prefersReducedMotion ? 1 : 0.97,
            }}
            transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
            onClick={() => dismiss(item.id)}
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto w-full max-w-sm cursor-pointer rounded-14 border px-4 py-3 text-sm font-semibold shadow-button sm:w-auto",
              item.variant === "success" && "border-primary/20 bg-mint-50 text-primary-dark",
              item.variant === "error" && "border-red-200 bg-red-50 text-red-700",
              item.variant === "default" && "border-border bg-surface text-foreground"
            )}
          >
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
