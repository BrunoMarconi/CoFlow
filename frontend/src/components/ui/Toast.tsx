"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MOTION_SPRING, projectMomentum } from "@/lib/motionTokens";
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

/* Patrones hapticos de confirmacion y de error. Van aqui, y no en la
 * capa generica de HapticFeedback (que cubre el toque de cualquier
 * control), porque el evento que los causa no es un dedo: es que la
 * accion ha terminado bien o mal. Reservarlos para eso es lo que
 * mantiene que signifiquen algo — un haptico en todo acaba ignorandose
 * como el ruido de fondo que es.
 *
 * Se disparan en el mismo push que monta el toast, asi que el pulso y
 * la aparicion caen en el mismo frame: si se separan, deja de leerse
 * como una sola respuesta y pasan a ser dos avisos distintos. */
const HAPTIC_PATTERN: Partial<Record<ToastVariant, number[]>> = {
  success: [10, 35, 14],
  error: [22, 45, 22],
};

function pulse(variant: ToastVariant) {
  const pattern = HAPTIC_PATTERN[variant];
  if (!pattern || typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  navigator.vibrate(pattern);
}

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
  pulse(variant);

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
            /* Muelle critico, no una curva de duracion fija: el toast
               aparece SIN que nadie lo haya empujado, asi que no debe
               sobrepasar. Y al ser muelle, un segundo toast que llega
               mientras este todavia se coloca no le corta el
               movimiento: lo redirige desde donde esta. */
            transition={
              prefersReducedMotion ? { duration: 0.01 } : MOTION_SPRING.standard
            }
            /* Se puede apartar de un manotazo hacia abajo. El umbral no
               es una distancia fija: se proyecta donde acabaria el
               toast si se soltase, para que un gesto corto pero rapido
               tambien lo descarte. */
            drag={prefersReducedMotion ? false : "y"}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.1, bottom: 0 }}
            dragMomentum={false}
            onDragEnd={(_event, info) => {
              const projected = info.offset.y + projectMomentum(info.velocity.y);
              if (projected > 48) dismiss(item.id);
            }}
            onClick={() => dismiss(item.id)}
            /* Un error no puede esperar a que el lector de pantalla
               termine lo que estaba diciendo; el resto si. */
            role={item.variant === "error" ? "alert" : "status"}
            aria-live={item.variant === "error" ? "assertive" : "polite"}
            className={cn(
              "press pointer-events-auto flex w-full max-w-sm cursor-pointer touch-none items-center gap-2.5 rounded-14 border px-4 py-3 text-sm font-semibold shadow-card sm:w-auto",
              item.variant === "success" && "border-primary/20 bg-mint-50 text-primary-dark",
              item.variant === "error" && "border-red-200 bg-red-50 text-red-700",
              item.variant === "default" && "border-border bg-surface text-foreground"
            )}
          >
            {/* La marca reserva el verde para acciones, iconos y texto:
                nunca como mancha de fondo. Con esa regla, un toast de
                exito y uno normal quedaban siendo la misma tarjeta
                blanca con un borde casi invisible — el tipo de aviso
                (confirmacion / error) no se distinguia de un vistazo.
                El icono lleva ese peso sin romper la regla de color. */}
            {item.variant !== "default" && (
              <ToastIcon variant={item.variant} />
            )}
            <span className="min-w-0">{item.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function ToastIcon({ variant }: { variant: Exclude<ToastVariant, "default"> }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4.5 w-4.5 shrink-0"
    >
      {variant === "success" ? (
        <path d="m4.5 12.5 5 5 10-11" />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <path d="M12 7.5v5.5" />
          <path d="M12 16.5h.01" />
        </>
      )}
    </svg>
  );
}
