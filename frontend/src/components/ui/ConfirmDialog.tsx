"use client";

import BottomSheet from "@/components/ui/BottomSheet";
import SecondaryButton from "@/components/ui/SecondaryButton";

/** Confirmación para acciones sensibles (abandonar comunidad, eliminar
 * cuenta, cerrar sesiones remotas...) — bottom sheet en móvil, diálogo
 * en desktop, sobre el mismo BottomSheet base. No ejecuta la acción
 * por sí solo: el consumidor decide qué pasa en `onConfirm`. */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  pending = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Estilo rojo para la acción de confirmar — solo para consecuencias
   * irreversibles o destructivas. */
  destructive?: boolean;
  /** Mientras la acción está en curso: desactiva ambos botones y el
   * cierre por overlay, para no dejar la confirmación a medias. */
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      onClose={onClose}
      ariaLabel={title}
      className="sm:max-w-sm"
      closeOnOutsideClick={!pending}
    >
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-brand-dark">{title}</h2>

        {description && (
          <p className="mt-2 text-sm leading-6 text-secondary">
            {description}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <SecondaryButton
            onClick={onClose}
            disabled={pending}
            className="flex-1"
          >
            {cancelLabel}
          </SecondaryButton>

          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
            className={`press-control inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-14 px-5 text-sm font-bold text-white shadow-button ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {/* "Espera..." es un texto, no un estado: no dice si algo se
                está moviendo ni cuánto queda, y en una conexión lenta
                deja al usuario sin saber si su toque llegó a registrarse.
                El indicador girando es la señal de que la acción sigue
                viva; la etiqueta se mantiene para no perder de vista QUÉ
                se está confirmando. */}
            {pending && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
              />
            )}
            {pending ? "Confirmando..." : confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
