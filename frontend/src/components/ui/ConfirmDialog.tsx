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
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-14 px-5 text-sm font-bold text-white shadow-button transition-all duration-150 ease-out hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary-hover"
            }`}
          >
            {pending ? "Espera..." : confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
