"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/* Bottom sheet en móvil / diálogo centrado en desktop — mismo patrón
 * que ya existían por duplicado en PersonPreviewPanel.tsx y
 * NotificationBell.tsx (mismos umbrales de arrastre, mismo bloqueo de
 * scroll, mismas curvas). Se extrae aquí para que cualquier pantalla
 * nueva (ediciones pequeñas, confirmaciones) lo reutilice en vez de
 * reimplementarlo una vez más. No sustituye todavía a esos dos usos
 * existentes — eso es un cambio aparte, no de esta pieza base. */

const DRAG_CLOSE_OFFSET = 120;
const DRAG_CLOSE_VELOCITY = 600;

export default function BottomSheet({
  onClose,
  children,
  className,
  ariaLabel,
  closeOnOutsideClick = true,
  lockBodyScroll = true,
  showDragHandle = true,
}: {
  onClose: () => void;
  children: ReactNode;
  /** Clases extra para el panel (p. ej. `sm:max-w-sm` en confirmaciones
   * pequeñas frente al `sm:max-w-lg` por defecto). */
  className?: string;
  ariaLabel?: string;
  /** Pulsar el overlay cierra el sheet — desactivar para diálogos que
   * exigen una decisión explícita (p. ej. mientras hay un envío en curso). */
  closeOnOutsideClick?: boolean;
  lockBodyScroll?: boolean;
  showDragHandle?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelRef = useRef<HTMLDivElement>(null);

  // document/createPortal no existen en el render de servidor — igual
  // que NotificationBell, se retrasa el portal a después de montar en
  // cliente en vez de asumir que siempre hay DOM disponible.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!lockBodyScroll) return;

    // overflow:hidden en body no basta en iOS Safari (el scroll de
    // fondo sigue rebotando) — se fija el body en su posición actual
    // con position:fixed y se restaura al cerrar.
    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.position = previousStyle.position;
      body.style.top = previousStyle.top;
      body.style.left = previousStyle.left;
      body.style.right = previousStyle.right;
      body.style.width = previousStyle.width;
      window.scrollTo(0, scrollY);
    };
  }, [lockBodyScroll]);

  const overlayTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out };

  const sheetTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : isDesktop
      ? { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }
      : MOTION_SPRING.gentle;

  const sheetInitial = prefersReducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.96 }
      : { y: 40, opacity: 0, scale: 0.98 };

  const sheetAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : isDesktop
      ? { opacity: 1, scale: 1 }
      : { y: 0, opacity: 1, scale: 1 };

  const canDrag = !prefersReducedMotion && !isDesktop;

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) {
    if (
      info.offset.y > DRAG_CLOSE_OFFSET ||
      info.velocity.y > DRAG_CLOSE_VELOCITY
    ) {
      onClose();
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center sm:items-center">
      <motion.button
        type="button"
        aria-label="Cerrar"
        onClick={closeOnOutsideClick ? onClose : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={overlayTransition}
        className="absolute inset-0 bg-black/40"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        initial={sheetInitial}
        animate={sheetAnimate}
        exit={sheetInitial}
        transition={sheetTransition}
        drag={canDrag ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
        style={{ willChange: "transform" }}
        className={cn(
          "relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-24 bg-surface shadow-2xl sm:max-w-lg sm:rounded-24",
          className
        )}
      >
        {showDragHandle && (
          <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
            <span className="h-1.5 w-10 rounded-full bg-border" />
          </div>
        )}

        {children}
      </motion.div>
    </div>,
    document.body
  );
}
