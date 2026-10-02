"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomSheet from "@/components/ui/BottomSheet";
import CountUp from "@/components/ui/CountUp";
import { MOTION_DURATION, MOTION_SPRING } from "@/lib/motionTokens";

/** Panel de filtros de Personas y Comunidades: sheet desde abajo en
 * móvil, panel lateral a toda altura en escritorio. El caller lo monta
 * dentro de un AnimatePresence, igual que cualquier otro BottomSheet. */
export default function FilterSheet({
  onClose,
  canReset,
  onReset,
  resultCount,
  resultNoun,
  children,
}: {
  onClose: () => void;
  /** "Restablecer" solo existe cuando hay algo que restablecer: en un
   * panel recién abierto era un botón muerto. */
  canReset: boolean;
  onReset: () => void;
  resultCount: number;
  /** [singular, plural] — p. ej. ["persona afín", "personas afines"]. */
  resultNoun: readonly [string, string];
  children: ReactNode;
}) {
  return (
    <BottomSheet
      onClose={onClose}
      ariaLabel="Filtros de convivencia"
      desktopPlacement="side"
    >
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-border px-4 pb-3.5 pt-1 sm:px-5 sm:pt-5">
        <AnimatePresence initial={false}>
          {canReset ? (
            <motion.button
              key="reset"
              type="button"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: MOTION_DURATION.fast }}
              onClick={onReset}
              className="min-h-9 justify-self-start text-muted transition hover:text-foreground"
            >
              <span className="text-xs font-semibold">Restablecer</span>
            </motion.button>
          ) : (
            <span key="reset-placeholder" />
          )}
        </AnimatePresence>

        <div className="text-center">
          <h2 className="font-rounded text-lg font-bold tracking-[-.035em] text-foreground">
            Filtros de convivencia
          </h2>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-3xs text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Algoritmo CoFlow
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full bg-surface-soft text-secondary transition hover:bg-border"
          aria-label="Cerrar filtros"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface-soft">
        {children}
      </div>

      <div className="shrink-0 border-t border-border bg-surface p-4 pb-[calc(1rem+var(--safe-bottom))]">
        <motion.button
          type="button"
          onClick={onClose}
          disabled={resultCount === 0}
          whileTap={{ scale: 0.98 }}
          transition={MOTION_SPRING.snappy}
          className="flex h-14 w-full items-center justify-between rounded-field bg-primary px-5 text-white shadow-modal transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-muted"
        >
          {/* El recuento cuenta en vivo mientras se tocan los filtros:
              es la respuesta a "¿me estoy quedando sin resultados?"
              sin tener que cerrar el panel para comprobarlo. */}
          <span className="text-sm font-bold">
            {resultCount === 0 ? (
              "Sin resultados"
            ) : (
              <>
                Ver <CountUp value={resultCount} durationSeconds={0.4} />{" "}
                {resultCount === 1 ? resultNoun[0] : resultNoun[1]}
              </>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/75">
            Aplicar filtros <ArrowIcon />
          </span>
        </motion.button>
      </div>
    </BottomSheet>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
