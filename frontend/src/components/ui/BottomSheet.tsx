"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  MOTION_DURATION,
  MOTION_EASE,
  MOTION_SPRING,
  projectMomentum,
} from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/* Bottom sheet en móvil / diálogo centrado en desktop — mismo patrón
 * que ya existían por duplicado en PersonPreviewPanel.tsx y
 * NotificationBell.tsx (mismos umbrales de arrastre, mismo bloqueo de
 * scroll, mismas curvas). Se extrae aquí para que cualquier pantalla
 * nueva (ediciones pequeñas, confirmaciones) lo reutilice en vez de
 * reimplementarlo una vez más. No sustituye todavía a esos dos usos
 * existentes — eso es un cambio aparte, no de esta pieza base.
 *
 * --- Física del arrastre ----------------------------------------------
 * El sheet ya no decide por umbrales fijos (antes: 120px de recorrido o
 * 600px/s). Ahora hace lo que hace iOS:
 *
 *   1. Sigue al dedo 1:1 hacia abajo (dragElastic bottom: 1). Antes
 *      cedía solo un 60% del recorrido en LOS DOS sentidos, y eso rompe
 *      la ilusión de estar tocando el panel: la goma es para los BORDES
 *      (arriba, donde ya no queda recorrido), no para la dirección
 *      natural del gesto.
 *   2. Al soltar, proyecta dónde acabaría el panel si se dejase frenar
 *      solo, y decide con ESE punto. Es lo que hace que un flick corto
 *      pero rápido cierre, y un arrastre largo y lento no.
 *   3. Tanto la vuelta a su sitio como el cierre arrancan con la
 *      velocidad del dedo, así que no hay costura entre "arrastrando" y
 *      "animando".
 *   4. El velo se aclara de forma continua mientras arrastras, no solo
 *      al final: el gesto informa durante todo el recorrido.
 *
 * La `y` la llevan las props declarativas y el propio gesto, no un
 * motion value nuestro: con `drag` activo el gesto se queda con esa
 * propiedad y cualquier animación externa sobre ella se queda
 * congelada (comprobado en framer-motion 13 — el panel no llegaba
 * siquiera a subir a su sitio). */

/** Fracción de la altura del panel que hay que proyectar hacia abajo
 * para que el gesto cuente como "cerrar". */
const DISMISS_PROJECTION_RATIO = 0.5;

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/* Sheets abiertos a la vez (uno puede abrir otro): el marcador que
 * aparta la app solo se retira cuando se cierra el último. */
let openSheetCount = 0;

function acquireStackedBackdrop() {
  openSheetCount += 1;
  document.body.dataset.sheetOpen = "true";

  return () => {
    openSheetCount = Math.max(openSheetCount - 1, 0);
    if (openSheetCount === 0) delete document.body.dataset.sheetOpen;
  };
}

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

  /* Recorrido del arrastre en curso. Solo alimenta al velo, para que
   * responda de forma continua durante el gesto y no únicamente al
   * soltar. Coincide con el desplazamiento real del panel porque hacia
   * abajo el seguimiento es 1:1. */
  const dragY = useMotionValue(0);
  const panelHeightRef = useRef(0);

  /** Gesto que ya ha decidido cerrar: el destino declarativo pasa a ser
   * "fuera de pantalla", con la velocidad del dedo como impulso inicial. */
  const [dismissal, setDismissal] = useState<{
    distance: number;
    velocity: number;
  } | null>(null);

  /** El panel está agarrado: la pestaña se ensancha y se marca en el
   * pointer-down, sin esperar a que haya movimiento. Un tirador que no
   * reacciona hasta que arrastras no parece agarrable. */
  const [grabbed, setGrabbed] = useState(false);

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

  useEffect(() => acquireStackedBackdrop(), []);

  /* Foco. El panel declara aria-modal="true", que le promete al lector
   * de pantalla que fuera de aquí no hay nada — pero el foco seguía en
   * el botón que abrió el sheet, con lo que tabulando se salía del
   * diálogo sin cerrarlo y sin ninguna señal de haberlo hecho.
   *
   * Se enfoca el panel (no su primer control): así se anuncia el título
   * del diálogo antes que su primera acción, y en una confirmación
   * destructiva el foco no cae de entrada sobre un botón peligroso. Al
   * cerrar, el foco vuelve a donde estaba — nunca se deja al usuario
   * sin punto de retorno. */
  useEffect(() => {
    if (!mounted) return;

    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });

    function handleTab(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null);

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleTab);
      restoreTo?.focus?.({ preventScroll: true });
    };
  }, [mounted]);

  const overlayTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { duration: MOTION_DURATION.normal, ease: MOTION_EASE.out };

  /* El sheet móvil nace de un gesto (sube desde abajo) y se le permite el
   * rebote leve del drawer de iOS. El diálogo de escritorio aparece SIN
   * que nadie lo haya empujado: ahí el sobrepaso se lee como un tic, así
   * que va con el muelle crítico. */
  const sheetTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : isDesktop
      ? MOTION_SPRING.standard
      : MOTION_SPRING.sheet;

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

  /** Velo: opaco con el sheet en su sitio, se aclara según baja. */
  const overlayOpacity = useTransform(dragY, (value) => {
    const height = panelHeightRef.current || 1;
    return 1 - Math.min(Math.max(value, 0) / height, 1) * 0.75;
  });

  const handleDragStart = useCallback(() => {
    panelHeightRef.current = panelRef.current?.offsetHeight ?? 0;
  }, []);

  const handleDrag = useCallback(
    (_event: unknown, info: { offset: { y: number } }) => {
      dragY.set(info.offset.y);
    },
    [dragY]
  );

  const handleDragEnd = useCallback(
    (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: { offset: { y: number }; velocity: { y: number } }
    ) => {
      setGrabbed(false);

      const height =
        panelHeightRef.current || panelRef.current?.offsetHeight || 0;
      const velocity = info.velocity.y;

      // Dónde acabaría el panel si se soltase y se dejase frenar solo.
      const projected = info.offset.y + projectMomentum(velocity);

      if (height > 0 && projected > height * DISMISS_PROJECTION_RATIO) {
        setDismissal({ distance: height + 24, velocity });
        return;
      }

      // No cierra: framer devuelve el panel a sus límites heredando la
      // velocidad del gesto (ver dragTransition). El velo lo acompaña.
      dragY.set(0);
    },
    [dragY]
  );

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
        // La opacidad del velo la modula el arrastre en tiempo real: al
        // bajar el panel se aclara, así el gesto avisa de que soltar ahí
        // cierra antes de haberlo soltado.
        style={canDrag ? { opacity: overlayOpacity } : undefined}
        className="absolute inset-0 bg-black/40"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        initial={sheetInitial}
        animate={
          dismissal ? { y: dismissal.distance, opacity: 0 } : sheetAnimate
        }
        exit={sheetInitial}
        transition={
          dismissal
            ? { ...MOTION_SPRING.sheet, velocity: dismissal.velocity }
            : sheetTransition
        }
        onAnimationComplete={() => {
          if (dismissal) onClose();
        }}
        /* Ya cerrando: se suelta el gesto para que la salida no compita
           con el muelle de restitución del arrastre. */
        drag={canDrag && !dismissal ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        /* bottom: 1 = seguimiento 1:1 hacia abajo (la dirección natural
           del gesto). top: 0.06 = arriba apenas cede, como una goma. */
        dragElastic={{ top: 0.06, bottom: 1 }}
        dragMomentum={false}
        /* Muelle con el que el panel vuelve a su sitio si el gesto no
           llega a cerrar. framer le pasa la velocidad de salida del
           dedo, así que la vuelta continúa el gesto en vez de arrancar
           un movimiento nuevo. Son los valores del drawer de iOS. */
        dragTransition={{ bounceStiffness: 438, bounceDamping: 33 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onPointerDown={canDrag ? () => setGrabbed(true) : undefined}
        onPointerUp={canDrag ? () => setGrabbed(false) : undefined}
        onPointerCancel={canDrag ? () => setGrabbed(false) : undefined}
        style={{ willChange: "transform" }}
        className={cn(
          // focus:outline-none — el panel recibe el foco solo para que el
          // lector de pantalla anuncie el diálogo; no es un control, y un
          // aro alrededor de todo el sheet solo sería ruido visual.
          "relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-24 bg-surface shadow-modal focus:outline-none sm:max-w-lg sm:rounded-24",
          className
        )}
      >
        {showDragHandle && (
          <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
            <motion.span
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scaleX: grabbed ? 1.18 : 1, opacity: grabbed ? 1 : 0.7 }
              }
              transition={MOTION_SPRING.quick}
              className="h-1.5 w-10 rounded-full bg-neutral-mid/45"
            />
          </div>
        )}

        {children}
      </motion.div>
    </div>,
    document.body
  );
}
